/**
 * Created by sojharo on 6/12/2015.
 */
'use strict';

/**
 * This is the core File Transfer service. It is independent of the video call service. It depends on Signalling service
 * for doing Signalling. Furthermore, it uses services from configuration too. To use this, one should follow the WebRTC
 * call procedure. Here it is mostly same as standard procedure of a WebRTC call, but this service hides much of the
 * details from application.
 */
angular.module('cloudKiboApp')
  .factory('FileHangout', function FileHangout($rootScope, Room, FileUtility, $log) {
    var isChrome = !!navigator.webkitGetUserMedia;
    var fs_container = document.getElementById('filelist_container');
    window.URL = window.URL || window.webkitURL;
    /* sending functionality, only allow 1 file to be sent out at a time */
    var chunks = {};
    var meta = {};
    var filesysteminuse = false;
    var fileCount = 0;
    var receivedFileCount = 0;
    var FSdebug = true;
    /* Used in Chrome to handle larger files (and firefox with idb.filesystem.js) */
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    var file_to_upload;    /* "pointer" to external file */
    /* recieving functionality, values stored per user id */
    var fs = [];
    /* hold our filesystems for download files */
    var saved_fileEntry = [];
    /* holds temporary fileEntry's during last encryption hash check */
    var downloading = [];
    /* downloading or not */
    var recieved_meta = [];
    /* the file meta data other users send over */
    var recievedChunks = [];
    /* store the chunks in memory before writing them to filesystem */
    var recievedChunksWritePointer = [];
    /* stores the # of the next chunk to be written to the filesystem */
    var createdChunksWritePointer = [];
    /* true if the file has been created*/
    var requestedChunksWritePointer = [];
    /* stores the value of the next chunk to be requested */
    var file_username ='';
    /* event delegation
     * -we need to do this to form a chrome app - see https://developer.chrome.com/extensions/contentSecurityPolicy#H2-3
     * -huge thanks to http://stackoverflow.com/questions/13142664/are-multiple-elements-each-with-an-addeventlistener-allowed
     */
    function fileEventHandler(e) {
      e = e || window.event;
      var target = e.target || e.srcElement;
      if (target.id.search('-download') != -1) {
        download_file(target.id.replace("-download", ""));
      } else if (target.id.search('-cancel') != -1) {
        cancel_file(target.id.replace("-cancel", ""));
      } else if (target.id == 'upload_stop') {
        upload_stop();
      }
    }
    document.body.addEventListener('click', fileEventHandler, false);

    /* stop the uploading! */
    function upload_stop() {
      /* remove data */
      chunks = {};
      // $('#myModal').modal('hide');
      // $("[data-dismiss=modal]").trigger({ type: "click" });
      /* also clear the container */
     // create_or_clear_container(meta.fid);

      /** removing file entry from the container **/
      clear_container(meta.fid);

      console.log('i am clicked');

      //to remove file from recepients container
      /* send a kill message */
      /* adding file id:which data is killed */
      Room.sendDataChannelMessage(JSON.stringify({
        "eventName": "kill_msg",
        "data": {
          "kill": true,
          "fileid" : meta.fid
        }
      }));
      meta = {};



      /* firefox and chrome specific I think, but clear the file input */
      document.getElementById('file').value = '';
    }

    /* write a peice of a file to a file on the filesystem... allows for unlimited file size!
     * FF does have a limitation in that we cannot load files directly out of idb.filesystem.js, we must first load them into memory :(
     */
    function write_to_file(user_id, chunk_data, chunk_num, hash) {
      //console.log('got Chunks : ', chunk_data)
      /* store our chunk temporarily in memory */
      recievedChunks[user_id][chunk_num % FileUtility.getChunksPerAck()] = chunk_data;
      /* once done recieving all chunks for this ack, start writing to memory */
      if (chunk_num % FileUtility.getChunksPerAck() == (FileUtility.getChunksPerAck() - 1) || recieved_meta[user_id].numOfChunksInFile == (chunk_num + 1)) {
        store_in_fs(user_id, hash);
      }
    }

    /* only called by write_to_file */
    function store_in_fs(user_id, hash) {
      var options = null;
      /* massive thanks to http://stackoverflow.com/questions/10720704/filesystem-api-upload-from-local-drive-to-local-filesystem */
      if (createdChunksWritePointer[user_id] == false) {
        options = {create: true};
        createdChunksWritePointer[user_id] = true;
      } else {
        options = {create: false};
      }

      fs[user_id].root.getFile(
        recieved_meta[user_id].name,
        options,
        function (fileEntry) {
          /* create a writer that can put data in the file */
          fileEntry.createWriter(function (writer) {

            /* once we have written all chunks per ack */
            writer.onwriteend = function () {

              /* request the next chunk */
              recievedChunks[user_id] = [];
              requestedChunksWritePointer[user_id] += FileUtility.getChunksPerAck();

              if (recieved_meta[user_id].numOfChunksInFile > recievedChunksWritePointer[user_id]) {
                request_chunk(user_id, recievedChunksWritePointer[user_id], hash);
              }
            };

            writer.onerror = FileUtility.FSerrorHandler;

            /* build the blob based on the binary array this.recievedChunks[user_id] */
            var builder = new Blob(recievedChunks[user_id], [recieved_meta[user_id].type]);

            /* debug */
            if (FSdebug) {
              $log.debug("DEBUG: writing chunk2 " + recievedChunksWritePointer[user_id]);
              for (var i = 0; i < FileUtility.getChunksPerAck(); i++) {
                if (recievedChunks[user_id][i]) {
                  $log.debug('recieved chunk: '+ recievedChunks[user_id][i]);
                  //$log.debug('recived: ' + CryptoJS.SHA256(FileUtility._arrayBufferToBase64(recievedChunks[user_id][i])).toString(CryptoJS.enc.Base64));
                }
              }
            }

            /* write the blob to the file, this can only be called once! Will fail silently if called while writing! We avoid this by only writing once per ack. */
            var seek = recievedChunksWritePointer[user_id] * FileUtility.getChunkSize();
            writer.seek(seek);
            writer.write(builder);
            recievedChunksWritePointer[user_id] += FileUtility.getChunksPerAck();

            /* EOF condition */
            if (recieved_meta[user_id].numOfChunksInFile <= (recievedChunksWritePointer[user_id])) {
              //console.log("creating file link!");

              /* stop accepting file info */
              downloading[user_id] = false;

              if (isChrome) {
                create_file_link(recieved_meta[user_id], user_id, fileEntry);
              } else {
                /* one little idb.filesystem.js quirk */
                fileEntry.file(function (file) {
                  create_file_link(recieved_meta[user_id], user_id, file);
                  /* <-- file, not fileEntry */
                });
              }
              //}
            }
          }, FileUtility.FSerrorHandler);
        }, FileUtility.FSerrorHandler);
    }

    /* process local inbound files */
    function process_inbound_files(file) {

      file_to_upload = file;

      meta.name = file.name;
      meta.size = file.size;
      meta.filetype = file.type;
      meta.browser = isChrome ? 'chrome' : 'firefox';
      meta.uname = Room.getusername();
      meta.fid = fileCount; //to store file id;
      console.log(meta);

      send_meta();

      Room.sendChat("You have received a file. Download and Save it.");

      /* user 0 is this user! */
      create_upload_stop_link(file_to_upload.name, meta.fid);//, username);
    }

    /* inbound - recieve binary data (from a file)
     * we are going to have an expectation that these packets arrive in order (requires reliable datachannel)
     */
    function process_binary(id, message, hash) {
      if (!downloading[id]) {
        return;
      }

      if (FSdebug) {
        $log.debug("processing chunk # " + recieved_meta[id].chunks_recieved);
      }

      /* We can write to a file using FileSystem! Chrome has native support, FF uses idb.filesystem.js library */
      /* Note that decrypted file packets are passed here by file_decrypt, we don't have to do any decryption here */

      write_to_file(id, message, recieved_meta[id].chunks_recieved, hash);//id, rtc.usernames[id], message, recieved_meta[id].chunks_recieved, hash
      recieved_meta[id].chunks_recieved++;

      if (recieved_meta[id].numOfChunksInFile > recieved_meta[id].chunks_recieved) {
        update_container_percentage(id, recieved_meta[id].chunks_recieved - 1, recieved_meta[id].numOfChunksInFile, recieved_meta[id].size);
      } else {
        //console.log("done downloading file!");
        /* stop accepting file info */
        downloading[id] = false;
        /* creating the download link is handled by write_to_file */
      }
    }

    /* inbound - recieve data
     * note that data.chunk refers to the incoming chunk #
     */
    function process_data(data) {
      data = JSON.parse(data).data;
      console.log('This is file data received ' + data);

      $log.debug('process_data function: ', data)
      if (data.file_meta) {
        /* we are recieving file meta data */

        /* if it contains file_meta, must be meta data! */
        recieved_meta[data.file_meta.fid] = data.file_meta;
        recieved_meta[data.file_meta.fid].numOfChunksInFile = Math.ceil(recieved_meta[data.file_meta.fid].size / FileUtility.getChunkSize());
        recieved_meta[data.file_meta.fid].name = FileUtility.sanitize(recieved_meta[data.file_meta.fid].name);

        /* we are not downloading anymore if we just got meta data from a user
         * call to create_pre_file_link is reliant on this to not display [c] button on new file information
         */
        downloading[data.file_meta.fid] = false;
        delete_file(data.file_meta.fid);


        /* create a download link */
       // create_pre_file_link(recieved_meta[0], 0, data.username);
        create_pre_file_link(recieved_meta[data.file_meta.fid], data.file_meta.fid, data.file_meta.uname);
        /* if auto-download, start the process */
        /* removed feature
         if ($("#auto_download").prop('checked')) {
         download_file(data.id);
         }
         */

        //console.log(recieved_meta[0]);
      } else if (data.kill) {
        /* if it is a kill msg, then the user on the other end has stopped uploading! */

        downloading[data.fileid] = false;
        delete_file(data.fileid);
        if (recieved_meta[data.fileid]) {
          recieved_meta[data.fileid].chunks_recieved = 0;
        }
       // create_or_clear_container(0);
        clear_container(data.fileid);

      } else if (data.ok_to_download) {
        console.log('data.ok_to_download');
        console.log(data);
        /* if we recieve an ok to download message from other host, our last file hash checks out and we can now offer the file up to the user */

        if (isChrome) {
          create_file_link(recieved_meta[data.file_meta.fid],data.file_meta.fid, saved_fileEntry[data.file_meta.fid]);
        } else {
          /* one little idb.filesystem.js quirk */
          saved_fileEntry[data.file_meta.fid].file(function (file) {
            create_file_link(recieved_meta[data.file_meta.fid],data.file_meta.fid, file);
            /* <-- file, not fileEntry */
          });
        }
      } else {

        $log.debug('Chunk is requested');
        console.log('Chunk is requested ');
        console.log(data);
        /* Otherwise, we are going to assume that if we have reached here, this is a request to download our file */
        if (data.chunk % FileUtility.getChunksPerAck() == 0) {
          for (var i = 0; i < FileUtility.getChunksPerAck(); i++) {
            send_chunk_if_queue_empty(data.fid, data.chunk + i, data.browser, data.rand, data.hash);
          }
        }
      }
    }

    /* request chunk # chunk_num from id, at this point just used to request the first chunk */
    function request_chunk(id, chunk_num, hash) {
      if (FSdebug) {
        $log.debug("DEBUG: requesting chunk " + chunk_num + " from " + id);
      }

      Room.sendDataChannelMessage(JSON.stringify({ //id, JSON.stringify({
        "eventName": "request_chunk",
        "data": {
          "chunk": chunk_num,
          "browser": isChrome ? 'chrome' : 'firefox',
          "fid" : id
        }
      }));

    }



    /* request id's file by sending request for block 0 */
    function download_file(id) {

      /* event listeners or javascript can call us, if id isn't set, must have been an event listener */
      /*if (typeof id == 'object') {
       var str = id.target.id;
       id = str.replace("-download", "");
       }*/
      console.log('Download File');
      /* We can't request multiple filesystems or resize it at this time. Avoiding hacking around this ATM
       * and will instead display warning that only 1 file can be downloaded at a time :(
       */
      if (filesysteminuse) {
        //console.log('Sorry, but only 1 file can be downloaded or stored in browser memory at a time, please [c]ancel or [d]elete the other download and try again.')
        boot_alert("Sorry, but only 1 file can be downloaded or stored in browser memory at a time, please [c]ancel or [d]elete the other download and try again.");
        return;
      }

      window.requestFileSystem(window.TEMPORARY, recieved_meta[id].size, function (filesystem) {
        fs[id] = filesystem;
        filesysteminuse = true;
        downloading[id] = true;
        /* accept file info from user */
        $log.debug('File System given to the program');
        request_chunk(id, 0, 0);
      });

      recieved_meta[id].chunks_recieved = 0;
      recievedChunksWritePointer[id] = 0;
      createdChunksWritePointer[id] = false;
      requestedChunksWritePointer[id] = 0;
      recievedChunks[id] = [];
    }

    /* delete a file - should be called when cancel is requested or kill is called */
    function delete_file(user_id) {
      if (fs[user_id]) {
        filesysteminuse = false;
        fs[user_id].root.getFile(recieved_meta[user_id].name, {create: false}, function (fileEntry) {
          fileEntry.remove(function () {
            $log.debug('File removed.');
          }, FileUtility.FSerrorHandler);
        }, FileUtility.FSerrorHandler);
      }
    }

    /* cancel incoming file */
    function cancel_file(id) {
      downloading[id] = false;
      /* deny file info from user */
      delete_file(id);
      recieved_meta[id].chunks_recieved = 0;
      /* create a new download link */
      create_pre_file_link(recieved_meta[id], id);
    }

    function clear_container(id)
    {
      var filelist = document.getElementById('filelist_container');
      var filecontainer = document.getElementById(id);
      filelist.removeChild(filecontainer);
    }
    /* creates an entry in our filelist for a user, if it doesn't exist already - TODO: move this to script.js? */
    function create_or_clear_container(id) {
      var filelist = document.getElementById('filelist_container');
      var filecontainer = document.getElementById(id);
      //username = FileUtility.sanitize(username);
      if (!filecontainer)
      {
        var filecontainer = document.createElement('div');
        filecontainer.setAttribute("id", id);
        filecontainer.className = 'fileTransferBox';
        fileCount = fileCount + 1;
      }
      /* if the user is downloading something from this person, we should only clear the inside span to save the cancel button */
      if (downloading[id] == true) {
        var span = document.getElementById(id + "-span");
        if (!span) {
          filecontainer.innerHTML = '<span class= "fileName" id="' + id + '-span"></span>';
          /* add cancel button */
          var a = document.createElement('a');
          a.download = meta.name;
          a.id = id + '-cancel';
          a.class = 'row';
          a.href = 'javascript:void(0);';
          a.style.cssText = 'color:#af4545;';
          a.textContent = '[c]';
          a.draggable = true;
          //append link!
          filecontainer.appendChild(a);
        } else {
          span.innerHTML = "";
        }
        return;
      }
      var username = ''; // temporary
      filelist.appendChild(filecontainer);
     // if (!filecontainer) {
        /* if filecontainer doesn't exist, create it */
     //   var fs = '<div id="' + id + '">' + username + '</div>';
     //   filelist.innerHTML = filelist.innerHTML + fs;
     // } else {
        /* if filecontainer does exist, clear it */
     //   filecontainer.innerHTML = username;
     // }

    }

    /* creates an entry in our filelist for a user, if it doesn't exist already */
    function remove_container(id) {
      var filecontainer = document.getElementById(id);

      if (filecontainer) {
        filecontainer.remove();
      }
      if (fs[id]) {
        delete_file(id);
      }
    }

    /* create a link that will let the user start the download */
    function create_upload_stop_link(filename, id) {//, username) {

      //create a place to store this if it does not already
      create_or_clear_container(id);//, username);
      var filecontainer = document.getElementById(id);

      //create the link
      var span = document.createElement('span');
      console.log('username is : '+  meta.uname);
      span.textContent = meta.uname + ' : ' + filename + ' ';

      var a = document.createElement('a');
      a.download = meta.name;
      a.id = 'upload_stop';
      a.class = 'row';
      a.href = 'javascript:void(0);';
      a.textContent = '[Stop Upload]';
      a.style.cssText = 'color:#af4545;';
      a.draggable = true;

      //append link!
      filecontainer.appendChild(span);
      filecontainer.appendChild(a);
  //    fs_container.appendChild(filecontainer);
       $('#myModalUpload').modal('show');

    }


    /* create a link that will let the user start the download */
    function create_pre_file_link(meta, id, username) {

      //create a place to store this if it does not already
      create_or_clear_container(id);
      var filecontainer = document.getElementById(id);

      //create the link
      var span = document.createElement('span');
      span.textContent = meta.uname + ' : ';

      var a = document.createElement('a');
      a.download = meta.name;
      a.id = id + '-download';
      a.class = 'icon-btn';
      a.href = 'javascript:void(0);';
      a.textContent = 'Download : ' + meta.name + ' ' + FileUtility.getReadableFileSizeString(meta.size);
      a.draggable = true;

      //append link!
      filecontainer.appendChild(span);
      filecontainer.appendChild(a);
      fs_container.appendChild(filecontainer);
       $('#myModal').modal('show');

      //append to chat
      //Room.sendChat($scope.user.username + " is now offering file " + meta.name);
    }

    /* update a file container with a DL % */
    function update_container_percentage(id, chunk_num, chunk_total, total_size) {

      create_or_clear_container(id);
      var span = document.getElementById(id + '-span');

      /* create file % based on chunk # downloaded */
      var percentage = (chunk_num / chunk_total) * 100;
      span.innerHTML = percentage.toFixed(1) + "% of " + FileUtility.getReadableFileSizeString(total_size) + ' ';

    }

    /* create a link to this file */
    function create_file_link(meta, id, fileEntry) {
      //grab the file type, should probably use a pattern match...
      var remove_base = meta.filetype.split(";");
      var remove_data = remove_base[0].split(":");
      var filetype = remove_data[1];
      var debase64_data;

      //create a place to store this if it does not already
      create_or_clear_container(id);
      var filecontainer = document.getElementById(id);

      //create the link
      var span = document.createElement('span');
      span.textContent = '';
      var a = document.createElement('a');
      a.download = meta.name;
      /* One difference with Chrome & FF :( */
      if (isChrome) {
        /* we are going to link to our local file system */
        a.href = fileEntry.toURL();
      } else {
        /* fileEntry is actually not a FileEntry, but a blob in Chrome */
        a.href = window.URL.createObjectURL(fileEntry);
      }
      a.textContent = 'Save : ' + meta.name;
      a.class = 'icon-btn';
      a.dataset.downloadurl = [filetype, a.download, a.href].join(':');
      a.draggable = true;

      //append link!
      var messages = document.getElementById('messages');
      filecontainer.appendChild(span);
      filecontainer.appendChild(a);

      /* make delete button */
      filecontainer.innerHTML = filecontainer.innerHTML + " ";
      /* add cancel button */
      var can = document.createElement('a');
      can.download = meta.name;
      can.id = id + '-cancel';
      a.class = 'icon-btn';
      can.href = 'javascript:void(0);';
      can.style.cssText = 'color:red;';
      can.textContent = '[d]';
      can.draggable = true;
      //append link!
      filecontainer.appendChild(can);

      //append to chat
      //Room.sendChat("File " + meta.name + " is ready to save locally");
    }

    /* send out meta data, allow for id to be empty = broadcast */
    function send_meta(id) {
      /*if (jQuery.isEmptyObject(meta)) {
       return;
       }*/

      //console.log("sending meta data");
      //console.log(meta);

      Room.sendDataChannelMessage(JSON.stringify({
        eventName: "data_msg",
        data: {
          file_meta: meta
        }
      }));

    }

    /* Please note that this works by sending one chunk per ack */
    function sendchunk(id, chunk_num, other_browser, rand, hash) {
      /* uncomment the following lines and set breakpoints on them to simulate an impaired connection */
      /* if (chunk_num == 30) { console.log("30 reached, breakpoint this line");}
       if (chunk_num == 50) { console.log("30 reached"); }*/

      var reader = new FileReader;
      var upper_limit = (chunk_num + 1) * FileUtility.getChunkSize();
      if (upper_limit > meta.size) {
        upper_limit = meta.size;
      }

      var seek = chunk_num * FileUtility.getChunkSize();
      var blob;
      if (typeof file_to_upload != 'undefined') {
        blob = file_to_upload.slice(seek, upper_limit);
      }
      reader.onload = function (event) {
        if (reader.readyState == FileReader.DONE) {

          //if (encryption_type != "NONE") {
          //	file_encrypt_and_send(id, event.target.result, rand, chunk_num);
          //} else {
          if (FSdebug) {
            $log.debug("DEBUG: sending chunk " + chunk_num);
            //$log.debug('sending: ' + CryptoJS.SHA256(FileUtility._arrayBufferToBase64(event.target.result)).toString(CryptoJS.enc.Base64));
          }

          Room.sendDataChannelMessage(event.target.result);

        }


      };
      reader.readAsArrayBuffer(blob);
    }

    /* ideally we would check the SCTP queue here to see if we could send, doesn't seem to work right now though... */
    function send_chunk_if_queue_empty(id, chunk_num, other_browser, rand, hash) {

      if (typeof file_to_upload != 'undefined') {
        if (chunk_num >= Math.ceil(file_to_upload.size / FileUtility.getChunkSize())) {
          return;
        }
      }

      sendchunk(id, chunk_num, other_browser, rand, hash);
    }

    return {

      accept_inbound_files : function(){

        document.getElementById('file').addEventListener('change', function (e) {
          if (e.target.files.length == 1) {
            var file = e.target.files[0];

            process_inbound_files(file);
          }
        }, false);

      },

      dataChannelMessage: function(id, data){
        //$log.debug('data channel message received in conference file transfer '+ data);
        if (data.byteLength  || typeof data !== 'string') {
          process_binary(id, data, 0);
        }
        else if (data.charAt(0) == '{' && data.charAt(data.length - 1) == '}') {
          $log.debug('Going to process data in file transfer conference '+ data);
          process_data(data);
        }
      }

    };





  });
