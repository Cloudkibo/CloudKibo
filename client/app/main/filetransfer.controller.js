 /**
 * Created by Saba on 06/05/2015.
 */
angular.module('cloudKiboApp')
  .controller('FileSharingController', function ($scope, $http, socket, Signalling, FileTransfer, $timeout, $location, RestApi, logger, $log) {

    var isChrome = !!navigator.webkitGetUserMedia;

    $scope.openFileView = false;

    $scope.openFileSendView = function () {
      return $scope.openFileView;
      $log.info("Opening file share view")
      logger.log("Opening file share view");
    };

    $scope.startFileChat = function () {
      $log.info("Inside file chat")
      logger.log("Inside file chat");
      $scope.openFileView = !$scope.openFileView;

      if (!FileTransfer.getIsStarted()) {

        FileTransfer.createPeerConnection(true, function (err) {
          $log.info("Creating peer connection");
          logger.log("Creating peer connection");
          if(err){
            $log.error('Fail to create peer connection '+ err)
            logger.log('Fail to create peer connection '+ err)
            alert('Failed to create connection. Make sure you are using latest browser.');
            $log.info("Failed Creating peer connection");
            logger.log("Failed Creating peer connection");
            $scope.openFileView = !$scope.openFileView;
          } else {

            Signalling.initialize($scope.otherUser.username, $scope.user.username, 'globalchatroom');
            $log.info("Initializing signalling");
            logger.log("Initializing signalling");

            FileTransfer.setIsStarted(true);
            $log.info("File trnsfer set to TRUE");
            logger.log("File trnsfer set to TRUE");
            FileTransfer.createAndSendOffer();
            $log.info("Calling create and send offer function");
            logger.log("Calling create and send offer function");
          }
        })

      }
      else{
        FileTransfer.endConnection();
        Signalling.sendMessageForDataChannel({type : 'bye'});
        $log.info("File transfer connection ended");
        logger.log("File transfer connection ended");
      }
    };

    $scope.$on('dataChannelMessageReceived', function() {

      var message = FileTransfer.getMessage();

      $log.info("file transfer msg: "+message);
      logger.log("file transfer msg: "+message);

      if (message.byteLength  || typeof message !== 'string') {
        process_binary(0, message, 0);
        $log.info("breaking into bytes");
        logger.log("breaking into bytes");
      }
      else if (message.charAt(0) == '{' && message.charAt(message.length - 1) == '}') {
        process_data(message);
        $scope.$apply(function () {
          $scope.openFileView = true;
          logger.log("set openFileView too TRUE")
          $log.info("set openFileView too TRUE")
        })
      }

    });

    socket.on('messagefordatachannel', function (message) {
      $log.info('Client received message: ' + message);
      logger.log('Client received message: ' + message);

      //if(message.split(' ')[1] === 'is' && message.split(' ')[2] === 'now' && message.split(' ')[3] === 'offering')
      //$scope.openFileView = true;

      if (message.type === 'bye') {
        FileTransfer.endConnection();
        $scope.openFileView = !$scope.openFileView;
        $log.info("File transfer connection ended");
        logger.log("File transfer connection ended");
      }
      else if (message === 'hangup') {
        FileTransfer.endConnection();
        $scope.openFileView = !$scope.openFileView;
        $log.info("File transfer connection hungup");
        logger.log("File transfer connection hungup");
      }
      else if (message.type === 'offer') {
        if (!FileTransfer.getIsStarted()) {

          FileTransfer.createPeerConnection(false, function (err) {
            if(err){
              alert('Failed to create connection. Make sure you are using latest browser.');
              $log.info("File transfer Failed");
              logger.log("Error: File transfer Failed");
              $scope.openFileView = !$scope.openFileView;
            } else {

              Signalling.initialize($scope.otherUser.username, $scope.user.username, 'globalchatroom');
              $log.info("File transfer signalling initialized");
              logger.log("File transfer signalling initialized");

              FileTransfer.setIsStarted(true);

            }
          })

        }
        FileTransfer.setRemoteDescription(message);
        FileTransfer.createAndSendAnswer();
      } else if (message.type === 'answer' && FileTransfer.getIsStarted()) {
        logger.log("setting remote description ")
        $log.info("setting remote description ")
        FileTransfer.setRemoteDescription(message);
      }
      else if (message.type === 'candidate' && FileTransfer.getIsStarted()) {
        logger.log("adding ice candidate ")
        $log.info("adding ice candidate ")
        FileTransfer.addIceCandidate(message);
      }
      else if (message === 'bye' && isStarted) {
        FileTransfer.endConnection();
        $log.info("calling end File transfer connection ")
        logger.log("calling end File transfer connection ")
      }

    });


    ////////////////////////////////////////////////////////////////////////////////////////
    // File Sharing Logic                                                                 //
    ///////////////////////////////////////////////////////////////////////////////////////

    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    window.URL = window.URL || window.webkitURL;
    accept_inbound_files();

    // event delegation
    // -we need to do this to form a chrome app - see https://developer.chrome.com/extensions/contentSecurityPolicy#H2-3
    // -huge thanks to http://stackoverflow.com/questions/13142664/are-multiple-elements-each-with-an-addeventlistener-allowed
    //
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

    // sending functionality, only allow 1 file to be sent out at a time
    var chunks = {};
    var meta = {};
    var filesysteminuse = false;
    var FSdebug = false;
    var chunksPerACK = 16; // 16k * 16 = 256k (buffer size in Chrome & seems to work 100% of the time)

    // Used in Chrome to handle larger files (and firefox with idb.filesystem.js)
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    var file_to_upload;    // "pointer" to external file

    // recieving functionality, values stored per user id
    var fs = [];  // hold our filesystems for download files
    var saved_fileEntry = []; // holds temporary fileEntry's during last encryption hash check
    var downloading = []; // downloading or not
    var recieved_meta = []; // the file meta data other users send over
    var recievedChunks = []; // store the chunks in memory before writing them to filesystem
    var recievedChunksWritePointer = []; // stores the # of the next chunk to be written to the filesystem
    var createdChunksWritePointer = []; // true if the file has been created
    var requestedChunksWritePointer = []; // stores the value of the next chunk to be requested

    // stop the uploading!
    function upload_stop() {

      $log.info("Stop uploading and remove data")
      logger.log("Stop uploading and remove data")
      chunks = {};
      meta = {};

      // also clear the container
      create_or_clear_container(0);
      $log.info("Clearing container")
      logger.log("Clearing container")

      // firefox and chrome specific I think, but clear the file input
      document.getElementById('file').value = '';
    }

    // write a peice of a file to a file on the filesystem... allows for unlimited file size!
    // FF does have a limitation in that we cannot load files directly out of idb.filesystem.js, we must first load them into memory :(

    function write_to_file(user_id, chunk_data, chunk_num, hash) {

      $log.info('got Chunks : ', chunk_data)
      logger.log('got Chunks : ', chunk_data)

      // store our chunk temporarily in memory
      recievedChunks[user_id][chunk_num % chunksPerACK] = chunk_data;
      $log.info("Storing chunk temporary")
      logger.log("Storing chunk temporary")

      // once done recieving all chunks for this ack, start writing to memory
      if (chunk_num % chunksPerACK == (chunksPerACK - 1) || recieved_meta[user_id].numOfChunksInFile == (chunk_num + 1)) {
        $log.info("Ack that all chunks received")
        logger.log("Ack that all chunks received")
        store_in_fs(user_id, hash);
        $log.info("Chunks writing to memory")
        logger.log("Chunks writing to memory")
      }
    }

    // only called by write_to_file
    function store_in_fs(user_id, hash) {
      var options = null;
      // massive thanks to http://stackoverflow.com/questions/10720704/filesystem-api-upload-from-local-drive-to-local-filesystem
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
          // create a writer that can put data in the file
          fileEntry.createWriter(function (writer) {
            $log.info("creating writer to put data in file")
          logger.log("creating writer to put data in file")
            // once we have written all chunks per ack
            writer.onwriteend = function () {
              $log.info("written. Requesting next chunk")
              logger.log("written. Requesting next chunk")
              // request the next chunk
              recievedChunks[user_id] = [];
              requestedChunksWritePointer[user_id] += chunksPerACK;

              if (recieved_meta[user_id].numOfChunksInFile > recievedChunksWritePointer[user_id]) {
                request_chunk(user_id, recievedChunksWritePointer[user_id], hash);
              }
            };

            writer.onerror = FileTransfer.FSerrorHandler;

            // build the blob based on the binary array this.recievedChunks[user_id]
            var builder = new Blob(recievedChunks[user_id], [recieved_meta[user_id].type]);

            // debug
            if (FSdebug) {
              $log.info("DEBUG: writing chunk2 " + recievedChunksWritePointer[user_id]);
              logger.log("DEBUG: writing chunk2 " + recievedChunksWritePointer[user_id]);
              for (var i = 0; i < chunksPerACK; i++) {
                if (recievedChunks[user_id][i]) {
                  $log.info('recived: ' + CryptoJS.SHA256(FileTransfer._arrayBufferToBase64(recievedChunks[user_id][i])).toString(CryptoJS.enc.Base64));
                  logger.log('recived: ' + CryptoJS.SHA256(FileTransfer._arrayBufferToBase64(recievedChunks[user_id][i])).toString(CryptoJS.enc.Base64));
                }
              }
            }

            /// write the blob to the file, this can only be called once! Will fail silently if called while writing! We avoid this by only writing once per ack.
            var seek = recievedChunksWritePointer[user_id] * FileTransfer.getChunkSize();
            writer.seek(seek);
            writer.write(builder);
            recievedChunksWritePointer[user_id] += chunksPerACK;

            // EOF condition
            if (recieved_meta[user_id].numOfChunksInFile <= (recievedChunksWritePointer[user_id])) {
              $log.info("creating file link!");
              logger.log("creating file link!");

              // stop accepting file info
              downloading[user_id] = false;
              $log.info("Stop accepting file!");
              logger.log("Stop accepting file!");

              // on encrypted completion here, send hash back to other user who verifies it, then sends the OK to finish back
              //if (encryption_type != "NONE") {
              //saved_fileEntry[user_id] = fileEntry;
              //request_chunk(user_id, recievedChunksWritePointer[user_id], hash); // this chunk doesn't exist, but we need the hash of the last chunk to be verified
              //} else {
              if (isChrome) {
                create_file_link(recieved_meta[user_id], user_id, fileEntry);
              } else {
                // one little idb.filesystem.js quirk
                fileEntry.file(function (file) {
                  create_file_link(recieved_meta[user_id], user_id, file); // <-- file, not fileEntry
                });
              }
              //}
            }
          }, FileTransfer.FSerrorHandler);
        }, FileTransfer.FSerrorHandler);
    }

    // process local inbound files
    function process_inbound_files(file) {

      file_to_upload = file;

      meta.name = file.name;
      meta.size = file.size;
      meta.filetype = file.type;
      meta.browser = isChrome ? 'chrome' : 'firefox';
      $log.info("file info: "+meta);
      logger.log("file info: "+meta);

      send_meta();

      FileTransfer.sendData("You have received a file. Download and Save it.");
      $log.info("can download and save file now")
      logger.log("can download and save file now")
      // user 0 is this user!
      create_upload_stop_link(file_to_upload.name, 0);//, username);
    }

    // Document bind's to accept files copied. Don't accept until we have a connection
    function accept_inbound_files() {

      document.getElementById('file').addEventListener('change', function (e) {
        if (e.target.files.length == 1) {
          var file = e.target.files[0];

          process_inbound_files(file);
        }
      }, false);
    }

    // inbound - recieve binary data (from a file)
    // we are going to have an expectation that these packets arrive in order (requires reliable datachannel)

    function process_binary(id, message, hash) {
      if (!downloading[id]) {
        return;
      }

      if (FSdebug) {
        $log.info("processing chunk # " + recieved_meta[id].chunks_recieved);
        logger.log("processing chunk # " + recieved_meta[id].chunks_recieved);
      }

      // We can write to a file using FileSystem! Chrome has native support, FF uses idb.filesystem.js library
      // Note that decrypted file packets are passed here by file_decrypt, we don't have to do any decryption here

      write_to_file(id, message, recieved_meta[id].chunks_recieved, hash);//id, rtc.usernames[id], message, recieved_meta[id].chunks_recieved, hash
      recieved_meta[id].chunks_recieved++;

      if (recieved_meta[id].numOfChunksInFile > recieved_meta[id].chunks_recieved) {
        update_container_percentage(id, recieved_meta[id].chunks_recieved - 1, recieved_meta[id].numOfChunksInFile, recieved_meta[id].size);
      } else {
        $log.info("done downloading file!");
        logger.log("done downloading file!");
        // stop accepting file info
        downloading[id] = false;
        // creating the download link is handled by write_to_file
      }
    }

    // inbound - recieve data
    // note that data.chunk refers to the incoming chunk #

    function process_data(data) {
      data = JSON.parse(data).data;
      $log.info('process_data function: ', data)
      logger.log('process_data function: ', data)
      if (data.file_meta) {
        // we are recieving file meta data

        // if it contains file_meta, must be meta data!
        recieved_meta[0] = data.file_meta;
        recieved_meta[0].numOfChunksInFile = Math.ceil(recieved_meta[0].size / FileTransfer.getChunkSize());
        recieved_meta[0].name = FileTransfer.sanitize(recieved_meta[0].name);

        /// we are not downloading anymore if we just got meta data from a user
        // call to create_pre_file_link is reliant on this to not display [c] button on new file information

        downloading[0] = false;
        delete_file(0);


        // create a download link
        create_pre_file_link(recieved_meta[0], 0, data.username);

        // if auto-download, start the process


        $log.info("dowanload link "+recieved_meta[0]);
        logger.log("dowanload link "+recieved_meta[0]);
      } else if (data.kill) {
        // if it is a kill msg, then the user on the other end has stopped uploading!

        downloading[0] = false;
        delete_file(0);
        if (recieved_meta[0]) {
          recieved_meta[0].chunks_recieved = 0;
        }
        create_or_clear_container(0);

      } else if (data.ok_to_download) {
        // if we recieve an ok to download message from other host, our last file hash checks out and we can now offer the file up to the user

        if (isChrome) {
          create_file_link(recieved_meta[0], 0, saved_fileEntry[0]);
        } else {
          // one little idb.filesystem.js quirk
          saved_fileEntry[0].file(function (file) {
            create_file_link(recieved_meta[0], 0, file); // <-- file, not fileEntry
            $log.info("Save file");
            logger.log("Save file");
          });
        }
      } else {

        $log.info('Chunk is requested by other peer')
        logger.log('Chunk is requested by other peer')

        // Otherwise, we are going to assume that if we have reached here, this is a request to download our file
        if (data.chunk % chunksPerACK == 0) {
          for (var i = 0; i < chunksPerACK; i++) {
            send_chunk_if_queue_empty(0, data.chunk + i, data.browser, data.rand, data.hash);
          }
        }
      }
    }

    // request chunk # chunk_num from id, at this point just used to request the first chunk
    function request_chunk(id, chunk_num, hash) {
      if (FSdebug) {
        $log.info("DEBUG: requesting chunk " + chunk_num + " from " + id);
        logger.log("DEBUG: requesting chunk " + chunk_num + " from " + id);
      }

      $log.info('Function which actually asks for chunk')
      logger.log('Function which actually asks for chunk')

      FileTransfer.sendData(JSON.stringify({ //id, JSON.stringify({
        "eventName": "request_chunk",
        "data": {
          "chunk": chunk_num,
          "browser": isChrome ? 'chrome' : 'firefox'
        }
      }));

    }

    // request id's file by sending request for block 0
    function download_file(id) {



      // We can't request multiple filesystems or resize it at this time. Avoiding hacking around this ATM
      // and will instead display warning that only 1 file can be downloaded at a time :(

      if (filesysteminuse) {
        $log.warn('Sorry, but only 1 file can be downloaded or stored in browser memory at a time, please [c]ancel or [d]elete the other download and try again.')
        logger.log('Sorry, but only 1 file can be downloaded or stored in browser memory at a time, please [c]ancel or [d]elete the other download and try again.')
        FileTransfer.bootAlert("Sorry, but only 1 file can be downloaded or stored in browser memory at a time, please [c]ancel or [d]elete the other download and try again.");
        return;
      }

      window.requestFileSystem(window.TEMPORARY, recieved_meta[id].size, function (filesystem) {
        fs[id] = filesystem;
        filesysteminuse = true;
        downloading[id] = true; // accept file info from user
        request_chunk(id, 0, 0);
      });

      recieved_meta[id].chunks_recieved = 0;
      recievedChunksWritePointer[id] = 0;
      createdChunksWritePointer[id] = false;
      requestedChunksWritePointer[id] = 0;
      recievedChunks[id] = [];
    }


    // delete a file - should be called when cancel is requested or kill is called
    function delete_file(user_id) {
      if (fs[user_id]) {
        filesysteminuse = false;
        fs[user_id].root.getFile(recieved_meta[user_id].name, {create: false}, function (fileEntry) {
          fileEntry.remove(function () {
            $log.info('File removed.');
            logger.log('File removed.');
          }, FileTransfer.FSerrorHandler);
        }, FileTransfer.FSerrorHandler);
      }
    }

    // cancel incoming file
    function cancel_file(id) {
      downloading[id] = false; /// deny file info from user
      delete_file(id);
      recieved_meta[id].chunks_recieved = 0;
      // create a new download link

      create_pre_file_link(recieved_meta[id], id);
    }


    // creates an entry in our filelist for a user, if it doesn't exist already - TODO: move this to script.js?
    function create_or_clear_container(id) {
      var filelist = document.getElementById('filelist_cointainer');
      var filecontainer = document.getElementById(id);

      // if the user is downloading something from this person, we should only clear the inside span to save the cancel button
      if (downloading[id] == true) {
        var span = document.getElementById(id + "-span");
        if (!span) {
          filecontainer.innerHTML = '<span id="' + id + '-span"></span>';
          // add cancel button
          var a = document.createElement('a');
          a.download = meta.name;
          a.id = id + '-cancel';
          a.href = 'javascript:void(0);';
          a.style.cssText = 'color:red;';
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
      if (!filecontainer) {
        // if filecontainer doesn't exist, create it
        var fs = '<div id="' + id + '">' + username + '</div>';
        filelist.innerHTML = filelist.innerHTML + fs;
      } else {
        // if filecontainer does exist, clear it
        filecontainer.innerHTML = username;
      }
    }


    // creates an entry in our filelist for a user, if it doesn't exist already
    function remove_container(id) {
      var filecontainer = document.getElementById(id);
      if (filecontainer) {
        filecontainer.remove();
      }
      if (fs[id]) {
        delete_file(id);
      }

    }

    /////////////
    // TODO Will see this later, commenting for now
    /////////////
    // create a link that will let the user start the download
    function create_upload_stop_link(filename, id) {//, username) {

      //create a place to store this if it does not already
      create_or_clear_container(id);//, username);
      var filecontainer = document.getElementById(id);

      //create the link
      var span = document.createElement('span');
      span.textContent = '' + filename + ' ';

      var a = document.createElement('a');
      a.download = meta.name;
      a.id = 'upload_stop';
      a.href = 'javascript:void(0);';
      a.textContent = '[Stop Upload]';
      a.style.cssText = 'color:red;';
      a.draggable = true;

      //append link!
      filecontainer.appendChild(span);
      filecontainer.appendChild(a);
      console.log("created link ");
      logger.log("created link ");
    }

    // create a link that will let the user start the download
    function create_pre_file_link(meta, id, username) {

      //create a place to store this if it does not already
      create_or_clear_container(id);
      var filecontainer = document.getElementById(id);

      //create the link
      var span = document.createElement('span');
      span.textContent = '';

      var a = document.createElement('a');
      a.download = meta.name;
      a.id = id + '-download';
      a.href = 'javascript:void(0);';
      a.textContent = 'Download : ' + meta.name + ' ' + FileTransfer.getReadableFileSizeString(meta.size);
      a.draggable = true;
      $log.info("creating file link to download");
      logger.log("creating file link to download");
      //append link!
      filecontainer.appendChild(span);
      filecontainer.appendChild(a);

      //append to chat
      //Signalling.sendMessageForDataChannel($scope.user.username + " is now offering file " + meta.name);
    }

    // update a file container with a DL %
    function update_container_percentage(id, chunk_num, chunk_total, total_size) {

      create_or_clear_container(id);
      var span = document.getElementById(id + '-span');

      // create file % based on chunk # downloaded
      var percentage = (chunk_num / chunk_total) * 100;
      span.innerHTML = percentage.toFixed(1) + "% of " + FileTransfer.getReadableFileSizeString(total_size) + ' ';

    }

    // create a link to this file
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
      // One difference with Chrome & FF :(
      if (isChrome) {
        // we are going to link to our local file system
        a.href = fileEntry.toURL();
      } else {
        // fileEntry is actually not a FileEntry, but a blob in Chrome
        a.href = window.URL.createObjectURL(fileEntry);
      }
      a.textContent = 'Save : ' + meta.name;
      a.dataset.downloadurl = [filetype, a.download, a.href].join(':');
      a.draggable = true;

      //append link!
      var messages = document.getElementById('messages');
      filecontainer.appendChild(span);
      filecontainer.appendChild(a);

      // make delete button
      filecontainer.innerHTML = filecontainer.innerHTML + " ";
      // add cancel button
      var can = document.createElement('a');
      can.download = meta.name;
      can.id = id + '-cancel';
      can.href = 'javascript:void(0);';
      can.style.cssText = 'color:red;';
      can.textContent = '[d]';
      can.draggable = true;
      //append link!
      filecontainer.appendChild(can);

      //append to chat
      //Signalling.sendMessageForDataChannel("File " + meta.name + " is ready to save locally");
    }


    // send out meta data, allow for id to be empty = broadcast
    function send_meta(id) {

      FileTransfer.sendData(JSON.stringify({
        eventName: "data_msg",
        data: {
          file_meta: meta
        }
      }));

    }

    // Please note that this works by sending one chunk per ack

    function sendchunk(id, chunk_num, other_browser, rand, hash) {
      // uncomment the following lines and set breakpoints on them to simulate an impaired connection

      var reader = new FileReader;
      var upper_limit = (chunk_num + 1) * FileTransfer.getChunkSize();

      if (upper_limit > meta.size) {
        upper_limit = meta.size;
      }

      var seek = chunk_num * FileTransfer.getChunkSize();
      var blob = file_to_upload.slice(seek, upper_limit);
      reader.onload = function (event) {
        if (reader.readyState == FileReader.DONE) {

          if (FSdebug) {
            $log.info("DEBUG: sending chunk " + chunk_num);
            logger.log("DEBUG: sending chunk " + chunk_num);
            $log.info('sending: ' + CryptoJS.SHA256(FileTransfer._arrayBufferToBase64(event.target.result)).toString(CryptoJS.enc.Base64));
            logger.log('sending: ' + CryptoJS.SHA256(FileTransfer._arrayBufferToBase64(event.target.result)).toString(CryptoJS.enc.Base64));
          }

          FileTransfer.sendData(event.target.result);//id, event.target.result);

        }

      };
      reader.readAsArrayBuffer(blob);
    }

    // ideally we would check the SCTP queue here to see if we could send, doesn't seem to work right now though...
    function send_chunk_if_queue_empty(id, chunk_num, other_browser, rand, hash) {

      if (chunk_num >= Math.ceil(file_to_upload.size / FileTransfer.getChunkSize())) {
        return;
      }


      sendchunk(id, chunk_num, other_browser, rand, hash);
    }

    ////////////////////////////////////////////////////////////////////////////////////////
    // File Sharing Logic End                                                              //
    ////////////////////////////////////////////////////////////////////////////////////////


  });
