// Capture audio and sketch pad

var Capture = function() {
    var student_id;
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
        audio: true,
        video: false
    };
    var videoConstraints = {
        audio: false,
        video: {
            mandatory: { },
            optional: []
        }
    };
    var screen_constraints;


    function init(sid, iid, hr){
        whiteboard_count = 0;
        student_id = sid;
        interaction_id = iid;
        help_request = hr[0];
        console.log(hr, help_request["id"]);
        if (hasGetUserMedia()) {
          // Good to go!
        } else {
            alert('getUserMedia() is not supported in your browser');
            console.log('getUserMedia() is not supported in your browser');
        }
        window.URL = window.URL || window.webkitURL;
        navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                                  navigator.mozGetUserMedia || navigator.msGetUserMedia;
        bindEvents();
        $("#capture-button").click();
        $("#new-whiteboard-button").click();
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

    function bindEvents(){
        // $(document).on("startCapture", start_capture_handler);
        // $(document).on("endCapture", end_capture_handler);
        $("#capture-button").click(capture_button_handler);
        $("#video-capture-button").click(video_capture_button_handler);
        $("#save-interaction-button").click(save_interaction_button_handler);
        $("#discard-interaction-button").click(discard_interaction_button_handler);
        $("#new-whiteboard-button").click(new_whiteboard_button_handler);
    }

    function new_whiteboard_button_handler(event){
        whiteboard_count += 1;
        var board_url = "http://ls.edx.org:1337/" + interaction_id + "_" + whiteboard_count;
        console.log("opening new whiteboard at", board_url);
        $("#whiteboard").attr("src", board_url);
    }

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
        window.location = "./view-layout";
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
            window.location = "./view-layout";
        });
    }

    function start_audio_capture(){
        if (!audioStream)
            navigator.getUserMedia(audioConstraints, function(stream) {
                if (window.IsChrome) stream = new window.MediaStream(stream.getAudioTracks());
                audioStream = stream;
                audio.src = URL.createObjectURL(audioStream);
                audio.play();
                // "audio" is a default type
                recorder = window.RecordRTC(stream, {
                    type: 'audio'
                });
                recorder.startRecording();
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
        recorder.stopRecording(function(url) {
            // console.log(url);
            // document.getElementById('audio-url-preview').innerHTML = '<a href="' + url + '" target="_blank">play recording</a>';
            upload_file(recorder.getBlob());
        });
        // TODO: update interaction information
    }

    function upload_file(blob){
        console.log(blob, help_request["id"]);
        var formData = new FormData();
        formData.append('interaction_id', interaction_id);
        formData.append('hr_id', help_request["id"]);
        formData.append('audio_file', blob);
        // xhr.send(formData);
        var csrftoken = getCookie('csrftoken');
        $.ajaxSetup({
            crossDomain: false, // obviates need for sameOrigin test
            beforeSend: function(xhr, settings) {
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
                // document.getElementById('audio-url-preview').innerHTML = '<a href="' + response["url"] + '" target="_blank">play recording</a>';
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
