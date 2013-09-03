// Capture audio inside iframe

var CaptureIframe = function() {
    var student_id;
    var instructor_id;
    var interaction_id;
    var help_request;
    var whiteboard_count;

    var localStream;
    var audio = document.querySelector('audio');
    var video = document.querySelector('video');
    var recorder;
    var audioStream;
    var videoStream;
    var audioConstraints = {
        "audio": true,
        "video": false
    };
    var videoConstraints = {
        audio: false,
        video: {
            mandatory: { },
            optional: []
        }
    };
    var screen_constraints;


    function init(sid, intid, instid, hr){
        whiteboard_count = 0;
        student_id = sid;
        interaction_id = intid;
        instructor_id = instid;
        help_request = hr[0];
        console.log(hr, help_request["id"]);
        if (hasGetUserMedia()) {
            window.URL = window.URL || window.webkitURL;
            navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                                      navigator.mozGetUserMedia || navigator.msGetUserMedia;
            bindEvents();
            $("#capture-button").click();
            // $("#new-whiteboard-button").click();
            // $("#introModal").modal({
            // });
        } else {
            // alert('getUserMedia() is not supported in your browser');
            console.log('getUserMedia() is not supported in your browser');
        }
    }

    function bindEvents(){
        // $(document).on("startCapture", start_capture_handler);
        // $(document).on("endCapture", end_capture_handler);
        $("#capture-button").click(capture_button_handler);
        $("#video-capture-button").click(video_capture_button_handler);
        // $("#save-interaction-button").click(save_interaction_button_handler);
        // $("#discard-interaction-button").click(discard_interaction_button_handler);
        // $("#new-whiteboard-button").click(new_whiteboard_button_handler);

        // window.addEventListener("message", receiveMessage, false);
        // $(document).on("mouseup", function(){
        //     console.log("mouseup detected.");
        //     // $("iframe").trigger("mouseup");
        //     // window.postMessage("mouse up detected", "http://localhost:3333/");
        //     // $("iframe")[0].contentWindow.postMessage("mouseup", "http://ls.edx.org:1337");
        //     $("iframe")[0].contentWindow.postMessage("mouseup", "http://ls.edx.org:2233/canvas/");
        // });
    }

    // function receiveMessage(event){
    //     console.log(event.origin, event.data, event.source);
    // }

//     function new_whiteboard_button_handler(event){
//         whiteboard_count += 1;
// //        var board_url = "http://ls.edx.org:1337/" + interaction_id + "_" + whiteboard_count;
//         var board_url = "http://ls.edx.org:2233/canvas/";
//         console.log("opening new whiteboard at", board_url);
//         $("#whiteboard").attr("src", board_url);
//     }

    function capture_button_handler(event){
        if ($(this).hasClass("recording")){
            $(this).removeClass("recording");
            $(this).text("Record Audio");
            stop_audio_capture();
        } else {
            $(this).addClass("recording");
            $(this).text("Stop Recording");
            start_audio_capture();
        }
    }

    function video_capture_button_handler(event){
        if ($(this).hasClass("recording")){
            $(this).removeClass("recording");
            $(this).text("Record Video");
            stop_video_capture();
        } else {
            $(this).addClass("recording");
            $(this).text("Stop Recording");
            start_video_capture();
        }
    }

    function discard_interaction_button_handler(event){
        // window.location = "./view-layout";
        window.location = "./view-layout?iid=" + instructor_id;
    }

    function save_interaction_button_handler(event){
        //TODO: update the status
        console.log("saved", $("#myModal #summary").val());
        var data = {
            "interaction_id": interaction_id,
            "instructor_summary": $("#myModal #summary").val()
        };
        var csrftoken = getCookie('csrftoken');
        $.ajaxSetup({
            crossDomain: false, // obviates need for sameOrigin test
            beforeSend: function(xhr, settings) {
                if (!csrfSafeMethod(settings.type)) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });

        $.post("/x2/ajax/capture/interaction/accept", {"data": JSON.stringify(data)}, function(data){
            console.log(data);
            window.location = "./view-layout?iid=" + instructor_id;
        });
    }

    function isCaptureScreen() {
        if (document.getElementById('record-screen').checked) {
            screen_constraints = {
                mandatory: { chromeMediaSource: 'screen' },
                optional: []
            };
            videoConstraints.video = screen_constraints;
        }
    }

    function capture_failure_handler(event){
        console.log("capture failure");
    }

    function start_audio_capture(){
        if (!audioStream)
            navigator.getUserMedia(audioConstraints, function(stream) {
                if (window.IsChrome)
                    stream = new window.MediaStream(stream.getAudioTracks());

                audioStream = stream;

                if (isIE()) {
                    audioStream.msStartRecording();
                } else {
                    audio.src = URL.createObjectURL(audioStream);
                    audio.play();
                    // "audio" is a default type
                    recorder = window.RecordRTC(stream, {
                        type: 'audio'
                    });
                    recorder.startRecording();
                }
            }, function() {
            });
        else {
            audio.src = URL.createObjectURL(audioStream);
            audio.play();
            recorder.startRecording();
        }

        window.isAudio = true;
    }

    function start_video_capture(){
        isCaptureScreen();
        if (!videoStream)
            navigator.getUserMedia(videoConstraints, function(stream) {
                video.src = URL.createObjectURL(stream);
                videoStream = stream;
                recorder = window.RecordRTC(stream, {
                    type: 'video',
                    width: 320,
                    height: 240
                });
                recorder.startRecording();
            }, function() {
                if (document.getElementById('record-screen').checked) {
                    if (location.protocol === 'http:')
                        alert('<https> is mandatory to capture screen.');
                    else
                        alert('Multi-capturing of screen is not allowed. Capturing process is denied. Are you enabled flag: "Enable screen capture support in getUserMedia"?');
                } else
                    alert('Webcam access is denied.');
            });
        else {
            video.src = URL.createObjectURL(videoStream);
            recorder.startRecording();
        }
        window.isAudio = false;
    }

    function stop_audio_capture(){
        audio.src = '';
        // TODO: update interaction information
        if (isIE()){
            // audioStream.msStopRecording(upload_file);
            setTimeout(audioStream.msStopRecording(upload_file), 200);
        } else {
            recorder.stopRecording(function(url) {
                // console.log(url);
                // document.getElementById('audio-url-preview').innerHTML = '<a href="' + url + '" target="_blank">play recording</a>';
                upload_file(recorder.getBlob());
            });
        }
    }

    function roughSizeOfObject( object ) {

        var objectList = [];

        var recurse = function( value )
        {
            var bytes = 0;

            if ( typeof value === 'boolean' ) {
                bytes = 4;
            }
            else if ( typeof value === 'string' ) {
                bytes = value.length * 2;
            }
            else if ( typeof value === 'number' ) {
                bytes = 8;
            }
            else if
            (
                typeof value === 'object'
                && objectList.indexOf( value ) === -1
            )
            {
                objectList[ objectList.length ] = value;

                for( i in value ) {
                    bytes+= 8; // an assumed existence overhead
                    bytes+= recurse( value[i] )
                }
            }

            return bytes;
        }

        return recurse( object );
    }


var filename = "";
var resultBlob;

    function onInitFs(fs) {
        console.log(filename);
      fs.root.getFile(filename, {}, function(fileEntry) {

        // Get a File object representing the file,
        // then use FileReader to read its contents.
        fileEntry.file(function(file) {
           var reader = new FileReader();

           reader.onloadend = function(e) {
             var txtArea = document.createElement('textarea');
             txtArea.value = this.result;
             document.body.appendChild(txtArea);
           };

           reader.readAsText(file);
        }, errorHandler);

      }, errorHandler);

    }

    function errorHandler(event){
        console.log(event);
    }    

    function upload_file(blob){
        if (isIE()){
            // var size = 0, key;
            // for (key in blob) {
            //     if (blob.hasOwnProperty(key)) size++;
            // }
            // resultBlob = blob;
            // console.dir(blob);
            // console.log(blob.size);
            // filename = createURLComObject.CreateAudioURL(blob);
            // console.log(filename);
            // var reader = new FileReader();
            
            // reader.onloadend = function(evt){
            //     console.log(evt);
            // }
            // console.log(reader);
            // reader.readAsText(blob);
            // console.log(window.Blob(blob));
            
            // var myArray = new ArrayBuffer(blob.length);
            // var writer = new Uint8Array(myArray);
            // for (var i=0; i<blob.length; i++){
                // longInt8View[i] = i % 255;
                // writer[i] = blob.charCodeAt(i);
                // writer[i] = blob[i];
                // if (i%1000==0)
                //     console.log(blob[i]);
            // }
            // console.log(typeof blob, myArray, myArray.length);
            // console.log(writer.length, writer, myArray.length);
            // resultBlob = new Blob([blob], {type: "application/octet-binary"});
            resultBlob = new Blob([blob], {type: "text/plain"});
            console.log(resultBlob);
            console.log(typeof resultBlob, typeof blob, blob.length, resultBlob.length);
            // playMediaObject.Play(blob);
            // window.requestFileSystem(window.TEMPORARY, 1024*1024, onInitFs, errorHandler);
        }

        console.log(blob, blob.length, help_request["id"]);
        var formData = new FormData();
        formData.append('interaction_id', interaction_id);
        formData.append('student_id', student_id);
        formData.append('hr_id', help_request["id"]);
        formData.append('audio_file', resultBlob);
        // xhr.send(formData);

        // var reader = new FileReader();
        // reader.addEventListener("loadend", function() {
        //     console.log(typeof reader.result, reader.result);
        //    // reader.result contains the contents of blob as a typed array
        // });
        // reader.readAsArrayBuffer(resultBlob);

        var oReq = new XMLHttpRequest();
        oReq.open("POST", "/x2/ajax/capture/interaction/stop", true);
        oReq.setRequestHeader("Content-Length", blob.length);
        oReq.onload = function(oEvent) {
          if (oReq.status == 200) {
            console.log("Uploaded!");
          } else {
            console.log("Error " + oReq.status + " occurred uploading your file.<br \/>");
          }
        };

        oReq.send(blob);
        
        var csrftoken = getCookie('csrftoken');
        $.ajaxSetup({
            crossDomain: false, // obviates need for sameOrigin test
            beforeSend: function(xhr, settings) {
                console.log(settings.type, csrfSafeMethod(settings.type), csrftoken);
                if (!csrfSafeMethod(settings.type)) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });

        $.ajax({
           url: "/x2/ajax/capture/interaction/stop",
           type: "POST",
           data: formData,
           processData: false,
           contentType: false,
           success: function(response) {
                console.log(response["message"]);
                $("#myModal .modal-title").text("Interaction successfully recorded.");
                $("#myModal .modal-body #preview-audio").attr("src", response["url"]);
                $('#myModal').modal({
                  keyboard: false
                });
           },
           error: function(jqXHR, textStatus, errorMessage) {
               console.log(jqXHR, textStatus, errorMessage);
               $("#myModal .modal-title").text("Interaction recording failed.");
               $('#myModal').modal({
                 keyboard: false
               });
           }
        });

    }

    function stop_video_capture(){
        recorder.stopRecording(function(url) {
            console.log(url);
            document.getElementById('video-url-preview').innerHTML = '<a href="' + url + '" target="_blank">open video.webm</a>';
        });
    }
    // function start_audio_capture(){
    //     if (navigator.getUserMedia) {
    //       navigator.getUserMedia({audio: true, video: false}, function(stream) {
    //         audio.src = window.URL.createObjectURL(stream);
    //         console.log(audio.src);
    //         localStream = stream;
    //       }, capture_failure_handler);
    //     } else {
    //         console.log("audio capture failed. fallback");
    //         // video.src = 'somevideo.webm'; // fallback.
    //     }
    // }

    // function stop_audio_capture(){
    //     console.log("stopped");
    //     localStream.stop();
    //     audio.play();
    // }


    return {
        init: init
    };
}();
