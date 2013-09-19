// Capture audio and sketch pad

var Capture = function() {
    var student_id;
    var instructor_id;
    var interaction_id;
    var help_request;
    var whiteboard_count;


    //var board_url = "http://ls.edx.org:2233/canvas/";
    //var board_url = "http://localhost:2233/canvas/";
    //var board_url = 'http://' + document.domain + ':2233/canvas'
    var capture_widget;
    var recording_state = 'off' // 'on', 'off', 'almost_on', 'almost_off'


    function init(sid, intid, instid, hr, cw){
        whiteboard_count = 0;
        student_id = sid;
        interaction_id = intid;
        instructor_id = instid;
        help_request = hr[0];
        capture_widget = cw; // the capturing canvas or other widget
        console.log(hr, help_request["id"]);

        console.log('student: ', student_id)
        console.log('instructor: ', instructor_id)
        console.log('interaction_id: ', interaction_id)
        console.log('help_request: ', help_request)


//        console.log("opening new whiteboard at", board_url);
//        $("#whiteboard").attr("src", board_url);

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
        //$("#discard-interaction-button").click(discard_interaction_button_handler);
        $("#discard-interaction-button").click(discard_interaction_button_handler)
        // $("#new-whiteboard-button").click(new_whiteboard_button_handler);

        $('#video-toggle').one('click', load_video_player_iframe)
        $('#video-iframe').load(resize_video_iframe_to_content)
    }

    function load_video_player_iframe(){
        var url = "/player/play.html?n=" + interaction_id;
        $("#video-iframe").attr('src', url)

    }

    function resize_video_iframe_to_content(){
        var width = $('#video-iframe').contents().find('canvas.video').outerWidth()
        width += 200
        console.log('resizing', width)
        $('#post-capture-dialog').css('width', width)
    }

    function capture_button_handler(event){

        if(recording_state == 'off'){
            // Start recording
            recording_state = 'almost_on'
            console.log(recording_state)
            $('#capture-button').text("please wait")
            $('#capture-button').removeClass('btn-success')
            $.jRecorder.record(600)
            capture_widget.start_recording()
        }
        else if (recording_state == 'on')
        {
            // Stop recording
            recording_state = 'almost_off'
            console.log(recording_state)
            $('#capture-button').text("please wait")
            $('#capture-button').removeClass('btn-danger')
            $.jRecorder.stop() //sends audio to server todo separate

            capture_widget.stop_recording()
            var canvas_capture = capture_widget.get_recording()
            store_canvas_capture(canvas_capture)
            $("#post-capture-modal").modal()
        }
        else {
            console.log('still waiting')
        }

    }

    function store_canvas_capture(capture){

        var json_canvas_capture = JSON.stringify(capture)

        var host = '/x2/ajax/capture/interaction/store_media?media_type=canvascapture_json';
        var data  = {
            capture: json_canvas_capture,
            interaction_id: interaction_id
        }

        $.ajax({
            type: 'POST',
            url: host,
            data: data,
            success: function (e){console.log('posted capture success')}
        })

    }

    function discard_interaction_button_handler(event){
        console.log("discarded")
        location.reload(false)
    }

    function save_interaction_button_handler(event){
        //TODO: update the status

        var data = {
            "interaction_id": interaction_id,
            //"instructor_summary": $("#myModal #summary").val()
            instructor_summary: 'instructor summary'
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
            //window.location = "./view-layout?iid=" + instructor_id;
            location.reload(false)
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
