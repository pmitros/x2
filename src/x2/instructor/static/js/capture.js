// Capture audio and sketch pad

var Capture = function() {
    var student_id;
    var instructor_id;
    var interaction_id;
    var help_request;
    var whiteboard_count;

    //var board_url = "http://ls.edx.org:2233/canvas/";
    var board_url = "http://localhost:2233/canvas/";
    var recording_state = 'off' // 'on', 'off', 'almost_on', 'almost_off'


    function init(sid, intid, instid, hr){
        whiteboard_count = 0;
        student_id = sid;
        interaction_id = intid;
        instructor_id = instid;
        help_request = hr[0];
        console.log(hr, help_request["id"]);

        console.log('student: ', student_id)
        console.log('instructor: ', instructor_id)
        console.log('interaction_id: ', interaction_id)
        console.log('help_request: ', help_request)


        console.log("opening new whiteboard at", board_url);
        $("#whiteboard").attr("src", board_url);

        init_jrecorder()
        bindEvents()


        // if (hasGetUserMedia()) {
        //     window.URL = window.URL || window.webkitURL;
        //     navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia ||
        //                               navigator.mozGetUserMedia || navigator.msGetUserMedia;
        //     bindEvents();
        //     $("#capture-button").click();
        //     $("#new-whiteboard-button").click();
        //     $("#introModal").modal({
        //     });
        // } else {
        //     // alert('getUserMedia() is not supported in your browser');
        //     console.log('getUserMedia() is not supported in your browser');
        // }
    }

    function init_jrecorder(){

        $.jRecorder(

            {
                host: escape('/x2/ajax/capture/interaction/store_media?media_type=audio_wav&interaction_id='+interaction_id),

                callback_started_recording: function () {
                    recording_state = 'on'
                    $('#capture-button').text("Stop Recording")
                    $('#capture-button').addClass('btn-danger')
                    console.log('started recording')
                },
                callback_stopped_recording: function () {
                    recording_state = 'off'
                    $('#capture-button').addClass('btn-success')
                    console.log('stopped recording')
                    $('#capture-button').text("Done")
                    console.log('sending data')
                    $.jRecorder.sendData()
                },
                callback_activityLevel: function (level) {
                    //console.log('activity level: ', level)

                   if (level == -1) {
                        $('#levelbar').css("width", "0px");
                    }
                    else {
                        $('#levelbar').css("width", (level * 1) + "px");
                    }

                },
                callback_activityTime: function (time) {
                    console.log('activity time: ', time)
                },

                callback_finished_sending: function (time) {
                    console.log('finished sending: ', time)
                },


                swf_path: '/static/js/vendor/jRecorder.swf',

            }


        );
    }

    function bindEvents(){
        // $(document).on("startCapture", start_capture_handler);
        // $(document).on("endCapture", end_capture_handler);
        $("#capture-button").click(capture_button_handler);
        // $("#video-capture-button").click(video_capture_button_handler);
        $("#save-interaction-button").click(save_interaction_button_handler);
        $("#discard-interaction-button").click(discard_interaction_button_handler);
        // $("#new-whiteboard-button").click(new_whiteboard_button_handler);

        window.addEventListener("message", receiveMessage, false);
        $(document).on("mouseup", function(){
            console.log("mouseup detected.");
            // $("iframe").trigger("mouseup");
            // window.postMessage("mouse up detected", "http://localhost:3333/");
            // $("iframe")[0].contentWindow.postMessage("mouseup", "http://ls.edx.org:1337");
            $("iframe")[0].contentWindow.postMessage("mouseup", board_url);
        });
    }

    function receiveMessage(event){
        console.log(event.origin, event.data, event.source);
    }

    function capture_button_handler(event){

        if(recording_state == 'off'){
            recording_state = 'almost_on'
            console.log(recording_state)
            $('#capture-button').text("please wait")
            $('#capture-button').removeClass('btn-success')
            $.jRecorder.record(600)
        }
        else if (recording_state == 'on') {
            recording_state = 'almost_off'
            console.log(recording_state)
            $('#capture-button').text("please wait")
            $('#capture-button').removeClass('btn-danger')
            $.jRecorder.stop()
        }
        else {
            console.log('still waiting')
        }

    }

/*
    function new_whiteboard_button_handler(event){
        whiteboard_count += 1;
//        var board_url = "http://ls.edx.org:1337/" + interaction_id + "_" + whiteboard_count;
        var board_url = "http://ls.edx.org:2233/canvas/";
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
*/
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

/*
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
        formData.append('student_id', student_id);
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
*/

    return {
        init: init
    };
}();
