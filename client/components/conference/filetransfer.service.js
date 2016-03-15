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
  .factory('FileHangout', function FileHangout($rootScope, Room, FileUtility, $log,$timeout) {
    var isChrome = !!navigator.webkitGetUserMedia;
    var fs_container = document.getElementById('filelist_container');
    window.URL = window.URL || window.webkitURL;
    /* sending functionality, only allow 1 file to be sent out at a time */
    var chunks = {};
    var filesVisible = false;
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
    var fileID; /* to chk which file is requested*/
    /* stores the value of the next chunk to be requested */
    var file_username ='';
    var requesterid;
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
      }
      else if (target.id.search('-reject') != -1) {
        reject_file(target.id.replace("-reject", ""));
      }
      else if (target.id.search('-upload-stop') != -1) {
        upload_stop(target.id.replace("-upload-stop", ""));
      }
    }
    document.body.addEventListener('click', fileEventHandler, false);

    /* reject file - from reciever side */
    function reject_file(fileid)
    {
      clear_container(fileid);
    }
    /* stop the uploading! */
    function upload_stop(fileid) {
      /* remove data */
      chunks = {};
      // $('#myModal').modal('hide');
      // $("[data-dismiss=modal]").trigger({ type: "click" });
      /* also clear the container */
     // create_or_clear_container(meta.fid);

      /** removing file entry from the container **/
      clear_container(fileid);

      console.log('i am clicked and removing file with id : ' + fileid);

      //to remove file from recepients container
      /* send a kill message */
      /* adding file id:which data is killed */
      Room.sendDataChannelMessage(JSON.stringify({
        "eventName": "kill_msg",
        "data": {
          "kill": true,
          "fileid" : fileid
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
                request_chunk(user_id, recievedChunksWritePointer[user_id], hash,requesterid);
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
              console.log("creating file link!");

              /* stop accepting file info */
              downloading[user_id] = false;
              filesysteminuse = false;

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
      meta ={};
      meta.name = file.name;
      meta.size = file.size;
      meta.filetype = file.type;
      meta.browser = isChrome ? 'chrome' : 'firefox';
      meta.uname = Room.getusername();
      meta.fid = fileCount; //to store file id;
      console.log(meta);

      send_meta(meta);
      document.getElementById('file').value = '';
     // Room.sendChat("You have received a file. Download and Save it.");

      /* user 0 is this user! */
      create_upload_stop_link(meta.name, meta.fid);//, username);
    }

    /* inbound - recieve binary data (from a file)
     * we are going to have an expectation that these packets arrive in order (requires reliable datachannel)
     */
    function process_binary(id, message, hash) {

      console.log('processing_binary called : ');
      console.log(message);
      if (!downloading[fileID]) {
        return;
      }

      if (FSdebug) {
        $log.debug("processing chunk # " + recieved_meta[fileID].chunks_recieved);
      }

      /* We can write to a file using FileSystem! Chrome has native support, FF uses idb.filesystem.js library */
      /* Note that decrypted file packets are passed here by file_decrypt, we don't have to do any decryption here */

//      write_to_file(id, message, recieved_meta[message.fileid].chunks_recieved, hash);//id, rtc.usernames[id], message, recieved_meta[id].chunks_recieved, hash
      console.log('I am requesting with id : ' + requesterid);
      write_to_file(fileID, message, recieved_meta[fileID].chunks_recieved, hash);//id, rtc.usernames[id], message, recieved_meta[id].chunks_recieved, hash

      recieved_meta[fileID].chunks_recieved++;

      if (recieved_meta[fileID].numOfChunksInFile > recieved_meta[fileID].chunks_recieved) {
        console.log('showing percentage of file downloaded');
        console.log('file ID : '+ fileID);
        console.log('recieved_meta[fileID].chunks_recieved : '+ recieved_meta[fileID].chunks_recieved);
        console.log('recieved_meta[fileID].numOfChunksInFile : '+ recieved_meta[fileID].numOfChunksInFile);
        console.log('recieved_meta[fileID].size : '+ recieved_meta[fileID].size);


        update_container_percentage(fileID, recieved_meta[fileID].chunks_recieved - 1, recieved_meta[fileID].numOfChunksInFile, recieved_meta[fileID].size);

      } else {
        //console.log("done downloading file!");
        /* stop accepting file info */
        downloading[fileID] = false;
        fileID = '';
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
      //  $('#myModal').modal('show');
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

      }
      else {

        $log.debug('Chunk is requested');
        console.log('Chunk is requested from requestor : ' + data.requestorid);
        console.log(data);

        /* Otherwise, we are going to assume that if we have reached here, this is a request to download our file */
        if (data.chunk % FileUtility.getChunksPerAck() == 0) {
          for (var i = 0; i < FileUtility.getChunksPerAck(); i++) {
            send_chunk_if_queue_empty(data.fid, data.chunk + i, data.browser, data.rand, data.hash,data.requesterid);
          }
        }
      }
    }

    /* request chunk # chunk_num from id, at this point just used to request the first chunk */
    function request_chunk(id, chunk_num, hash,requesterid) {
      if (FSdebug) {
        $log.debug("DEBUG: requesting chunk " + chunk_num + " from " + id);
      }

      Room.sendDataChannelMessage(JSON.stringify({ //id, JSON.stringify({
        "eventName": "request_chunk",
        "data": {
          "chunk": chunk_num,
          "browser": isChrome ? 'chrome' : 'firefox',
          "fid" : id,
          "requesterid" : requesterid
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
        FileUtility.bootAlert("Sorry, but only 1 file can be downloaded or stored in browser memory at a time, please [c]ancel or [d]elete the other download and try again.");
        return;
      }
      /* ask for requester id */

      requesterid = Room.getcurrentid();
      console.log('File requester id is : ' + requesterid);
      fileID = id;
      window.requestFileSystem(window.TEMPORARY, recieved_meta[id].size, function (filesystem) {
        fs[id] = filesystem;
        filesysteminuse = true;
        downloading[id] = true;
        /* accept file info from user */
        $log.debug('File System given to the program');
        console.log('File id : '+id);
        request_chunk(id, 0, 0,requesterid);
      });

      console.log('File download is complete');
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

    /* will be called when stop upload is called */
    function clear_container(id)
    {

      var filecontainer = document.getElementById(id);
      fs_container.removeChild(filecontainer);
    }
    /* creates an entry in our filelist for a user, if it doesn't exist already - TODO: move this to script.js? */
    /* will be called when file is uploaded or the meta is received*/
    function create_container(id)
    {
      var filelist = document.getElementById('filelist_container');
      var filecontainer = document.getElementById(id);
      //username = FileUtility.sanitize(username);
      if (!filecontainer)
      {
        console.log('filecontainer doesnt exist,i am creating');
        var filecontainer = document.createElement('div');
        filecontainer.setAttribute("id", id);
        filecontainer.className = 'fileTransferBox';
        fileCount = fileCount + 1;
        filelist.appendChild(filecontainer);

      }

    }

    function create_or_clear_container(id) {
      var filelist = document.getElementById('filelist_container');
      var filecontainer = document.getElementById(id);
      /* if the user is downloading something from this person, we should only clear the inside span to save the cancel button */
      if (downloading[id] == true) {
        console.log('I am downloading file');
        var span = document.getElementById(id + "-span");
        if (span == null) {
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
          /** this code will execute when creating save file link **/
          console.log('i am clearing span');
       //   span.innerHTML = "";
          var a = document.getElementById(id+'-cancel');
          if(a != null)
            filecontainer.removeChild(a);
        }
        return;
      }



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

      //make filecontainer visible
      filesVisible = true;
      //create a place to store this if it does not already
      create_container(id);//, username);
      var filecontainer = document.getElementById(id);

      //create the link
      var span = document.createElement('span');
      var myspan = document.createElement('span');
      myspan.textContent = meta.uname + ' : ' ;
      myspan.style.display = "block";
      console.log('username is : '+  meta.uname);
      if(filename.length > 7) {
        span.textContent =  filename.substring(0,7) + '... ' + FileUtility.getReadableFileSizeString(meta.size);
      }
      else
      {
        span.textContent = filename +' '+ FileUtility.getReadableFileSizeString(meta.size);;
      }

      var a = document.createElement('a');
      a.download = meta.name;
      a.id = id+'-upload-stop';
      a.class = 'row';
      a.href = 'javascript:void(0);';
      a.textContent = '[Stop Upload]';
      a.style.cssText = 'color:#af4545;';
      a.draggable = true;
      a.style.float = 'left';
      //append link!
      filecontainer.appendChild(myspan);
      filecontainer.appendChild(span);
      filecontainer.appendChild(a);
  //    fs_container.appendChild(filecontainer);

       //$('#myModalUpload').modal('show');

    }


    /* create a link that will let the user start the download */
    function create_pre_file_link(meta, id, username) {

      filesVisible = true;//make filecontainer list visible

      //create a place to store this if it does not already
      create_container(id);
      var filecontainer = document.getElementById(id);
      var span = document.getElementById(id+'-username');
      var spanUpdate = document.getElementById(id+'-myspan');
      if(spanUpdate != null)
      {
        filecontainer.removeChild(spanUpdate);
        var c = document.getElementById(id+'-cancel');
        if(c!=null)
        {
          filecontainer.removeChild(c);
        }
      }
      if(span == null)
      {
      //create span showing username
        var span = document.createElement('span');
        span.textContent = meta.uname + ' : ';
        span.id = id+'-username';
        span.style.display = "block";
        filecontainer.appendChild(span);
      }

      /*** check if there is Save link,if yes then first clear it **/
      var savelnk = document.getElementById(id+'-save');
      if(savelnk != null)
      {
        filecontainer.removeChild(savelnk);
        var c = document.getElementById(id+'-cancel');
        if(c!=null)
        {
          filecontainer.removeChild(c);
        }
      }

      var a = document.createElement('a');
      var aa = document.createElement('a'); //reject download
      var myspan = document.createElement('span');
      myspan.setAttribute('id',id+'-span');
      a.download = meta.name;
      a.id = id + '-download';
      a.class = 'icon-btn';
      a.href = 'javascript:void(0);';

      aa.id = id + '-reject';
      aa.href = 'javascript:void(0);';
      aa.class = 'icon-btn';
      if(meta.name.length >7)
        myspan.textContent =  meta.name.substring(0,7) + '...  ' + FileUtility.getReadableFileSizeString(meta.size);
      else
        myspan.textContent = meta.name + ' ' + FileUtility.getReadableFileSizeString(meta.size);
      a.textContent = 'Accept';
      a.draggable = true;

      aa.textContent = 'Reject';
      aa.draggable = true;
      aa.style.float = 'right';
      a.style.float = 'left';
      //append link!
      filecontainer.appendChild(myspan);
      filecontainer.appendChild(a);
      filecontainer.appendChild(aa);



      //append to chat
      //Room.sendChat($scope.user.username + " is now offering file " + meta.name);
    }

    /* update a file container with a DL % */
    function update_container_percentage(id, chunk_num, chunk_total, total_size) {

      /** remove download link **/
       var a = document.getElementById(id+'-download');
      var aa = document.getElementById(id+'-reject');
      var sp = document.getElementById(id+'-span');

      var filecontainer = document.getElementById(id);
      if(a!=null)
      {

        filecontainer.removeChild(a);

      }
      if(aa != null)
      {
        filecontainer.removeChild(aa);
      }
      if(sp!=null)
      {
        filecontainer.removeChild(sp);//to clear filename
      }
      /* create file % based on chunk # downloaded */
      var span = document.getElementById(id+'-myspan');
      if(span == null)
      {
        span = document.createElement('span');
        span.setAttribute('id',id+'-myspan');
        filecontainer.appendChild(span);

        var a = document.createElement('a');
        a.download = meta.name;
        a.id = id + '-cancel';
        a.class = 'row';
        a.href = 'javascript:void(0);';
        a.style.cssText = 'color:#af4545;';
        a.textContent = '[Cancel]';
        a.draggable = true;
        a.style.float = 'left';
        //append link!

        filecontainer.appendChild(a);

      }
      var percentage = (chunk_num / chunk_total) * 100;
      span.innerHTML = percentage.toFixed(1) + "% of " + FileUtility.getReadableFileSizeString(total_size) + ' ';

    }

    /* create a link to this file */
    function create_file_link(meta, id, fileEntry) {
      //grab the file type, should probably use a pattern match...
      filesysteminuse = false;
      var remove_base = meta.filetype.split(";");
      var remove_data = remove_base[0].split(":");
      var filetype = remove_data[1];
      var debase64_data;

      //create a place to store this if it does not already
      create_or_clear_container(id);
      var filecontainer = document.getElementById(id);

      //create the link
      var span = document.getElementById(id + '-span');
      var updatespan = document.getElementById(id + '-myspan');
      if(updatespan != null)
      {
        filecontainer.removeChild(updatespan);//remove update percentage span
      }
      var c = document.getElementById(id + '-cancel');
      if(c !=null)
      {
        filecontainer.removeChild(c);
      }
      if(span != null) {
        if(meta.name.length >7)
          span.textContent =  meta.name.substring(0,7) + '...  ' + FileUtility.getReadableFileSizeString(meta.size);
        else
          span.textContent = meta.name + ' ' + FileUtility.getReadableFileSizeString(meta.size);

      }
      else{
        var myspan = document.createElement('span');
        if(meta.name.length >7)
          myspan.textContent =  meta.name.substring(0,7) + '...  ' + FileUtility.getReadableFileSizeString(meta.size);
        else
          myspan.textContent = meta.name + ' ' + FileUtility.getReadableFileSizeString(meta.size);
        filecontainer.appendChild(myspan);
      }

      var a = document.getElementById(id+'-download');
      var aa = document.getElementById(id+'-reject');
      if(a != null)
      {
      filecontainer.removeChild(a);
      }
      if(aa != null)
      {
        filecontainer.removeChild(aa);
      }
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
      a.textContent = 'Save';
      a.class = 'icon-btn';
      a.dataset.downloadurl = [filetype, a.download, a.href].join(':');
      a.draggable = true;
      a.id = id+'-save';
      a.style.float = 'left';
      //append link!
   //   var messages = document.getElementById('messages');
 //     filecontainer.appendChild(span);
      filecontainer.appendChild(a);
      a.click(); //to auto save after file is downloaded

      //remove filecontainer from filelist
      $timeout(function(){
      fs_container.removeChild(filecontainer)},3000);


      /****************** No purpose of this link button *******/
      /* make delete button */
    //  filecontainer.innerHTML = filecontainer.innerHTML + " ";
      /* add cancel button */
   /*   var can = document.createElement('a');
      can.download = meta.name;
      can.id = id + '-cancel';
      a.class = 'icon-btn';
      can.href = 'javascript:void(0);';
      can.style.cssText = 'color:red;';
      can.textContent = '[d]';
      can.draggable = true;
      //append link!
      filecontainer.appendChild(can);*/

      //append to chat
      //Room.sendChat("File " + meta.name + " is ready to save locally");
    }

    /* send out meta data, allow for id to be empty = broadcast */
    function send_meta(meta) {
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
    function sendchunk(id, chunk_num, other_browser, rand, hash,requesterid) {
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
            $log.debug("DEBUG: sending chunk " + chunk_num + "of file with id : " + id);
            //$log.debug('sending: ' + CryptoJS.SHA256(FileUtility._arrayBufferToBase64(event.target.result)).toString(CryptoJS.enc.Base64));
          }
          console.log('sending chunk');
          console.log(event.target.result);
   //       Room.sendDataChannelMessage(event.target.result);
          console.log('Calling Room.sendDataChannelMessageToUser(event.target.result,requesterid) with requestor id :' +requesterid );
          Room.sendDataChannelMessageToUser(event.target.result,requesterid);



        }


      };
      reader.readAsArrayBuffer(blob);
    }

    /* ideally we would check the SCTP queue here to see if we could send, doesn't seem to work right now though... */
    function send_chunk_if_queue_empty(id, chunk_num, other_browser, rand, hash,requesterid) {

      if (typeof file_to_upload != 'undefined') {
        if (chunk_num >= Math.ceil(file_to_upload.size / FileUtility.getChunkSize())) {
          return;
        }
      }

      sendchunk(id, chunk_num, other_browser, rand, hash,requesterid);
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

          if (data.byteLength || typeof data !== 'string') {
            console.log(data)
            console.log('Going to process binary data in file transfer conference ' + data);
            process_binary(id, data, 0);
          }

        else if (data.charAt(0) == '{' && data.charAt(data.length - 1) == '}') {
          console.log('Going to process data in file transfer conference '+ data);
          process_data(data);
        }
      },


      /*** function to return whether to show filelist container or not
       *
       */

      showfilesContainer :function(){
      //processing
      return filesVisible;
    },
      togglefilesContainer :function(){
        //processing
         filesVisible = !filesVisible;
        return filesVisible;
      }

    };




  });
