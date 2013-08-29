var Microsoft = {};

Microsoft.MediaCapture = function () {
    var videoDevicesCollector = new Array();
    var deviceID = null;
	var audioDevice = null;
	var videoDevice = null;

    // Set the Audio Options 
    var audioOptions =
    {
        duration: 30,                   // max duration in seconds
        limit: 1,                       // only need one recording
        mode: { type: "audio/x-wav"}    // audio mode
    }
	
    var retMediaCapture = null;
	var currentUrlForPreview = null;	
	
    // Set Endpoint Parameters
    var endpointParams = { sensitivity: 0.5, endTimeout: 2000, initialTimeout: 500 }

    // Set the image Options.
    var imageOptions =
    {
        width: 800,         // desired image width
        height: 600,        // desired image height
        imageFormat: "jpg"  // type of image to be saved
    }

    //Audio states
    var onEndpoint = function (endevent) {
        if (endevent == 0) {
            //INITIAL_SILENCE_DETECTED
        }
        else if (endevent == 1) {
            //SPEECH_DETECTED
        }
        else if (endevent == 2) {
            //END_SILENCE_DETECTED
        }
        else if (endevent == 3) {
            //NOISE_DETECTED
            recSession.stop();
        }
        else if (endevent == 4) {
            //NONSPEECH_TIMEOUT
            recSession.stop();
        }
        else if (endevent == 5) {
            //SPEECH_RECO
        }
    }

    // members for audio 
    var objAudioCap = null;
    var recSession = null;
    var recSessionAudio = null;
    var urlAudio = null;

    // Call Back For Record Started Event
    var playstream = null;

    // members for video 
    var objMediaCap = null;
    var vdoBlob = null;
    var isReady = false;
    var videoBlobUrl = null;

    var onUnload = function () {
        if (device) {
            device.close();
            isUnload = true;
        }
    }

    //Success callbacks
    var stopRecording = null;
    var currentCallback = null;

    var currentStream = null;
    var mediaStream = null;

    // Members for preview
    var domElementId = null;    
    var currentIdForPreview = null;

    // Initializin options
    var init = {};
	
    var isUnload = false;

    var blobCallback = function (blob, param) {
        if (param == "audio" && init.video && !urlAudio) {
            urlAudio = createURLComObject.CreateAudioURL(blob.data);
        }
        
		if (stopRecording != null && typeof(stopRecording) != "function") {
            ParameterError("stopRecording");
            return;
        }

        // If audio and video urls exists then remux them
        if (urlAudio && videoBlobUrl) {
            if (videoBlobUrl && vdoBlob) {
                var mediaBlob = new Blob;
                mediaBlob.data = objMicrosoftVideoAndAudioRemuxer.Remux(videoBlobUrl, urlAudio);
                mediaBlob.mode = "video";
				videoBlobUrl = null;
				urlAudio = null;
                // Success callback stopRecording
                stopRecording(mediaBlob);
            }
        }

        //Only video
        if (!init.audio) {
            stopRecording(vdoBlob);
        }

        //Only audio
        if (!init.video) {
            stopRecording(playstream.data);
        }
    }

    //Search dom element by src
    var searchIdbySrc = function (currentNode) {
        var listOfAllElementsWithSrc = currentNode.querySelectorAll("[src]");
		
        for (var i = 0; i < listOfAllElementsWithSrc.length; i++) {
            var curElemUrl = listOfAllElementsWithSrc[i].src;
            listOfAllElementsWithSrc[i].src = currentUrlForPreview;

            if (listOfAllElementsWithSrc[i].src == curElemUrl) {
                return listOfAllElementsWithSrc[i];
            }
            else {
                listOfAllElementsWithSrc[i].src = curElemUrl;
            }
        }
    }

    // Out url blob
    var urlBlobMedia = null;

    // Refresh image by dom element
    var render = function (vdoStream, element) {
        if (vdoStream) {
            // Recieve images for preview.
            vdoStream.mode = "image";
            url = URL.createObjectURL(vdoStream);

            if (url) {
                if (element.src) {
                    element.src = url;
                }
                else {
                    document[element].src = url;
                }
            }
            vdoStream = null;
        }
    }

	window.addEventListener("beforeunload", onUnload);
	window.addEventListener("unload", onUnload);
	var Capture;
	// Device capture
    var DeviceCapture = function() {

        this.openCapture = function(source, onOpenCapture, vdoDeviceId) {
            if (typeof (onOpenCapture) != "function") {
                ParameterError("onOpenCapture");
            }

            Capture = retMediaCapture = new Microsoft.MediaCapture.Capture();

			if (init.audio){
				objMicrosoftAudioCapture.OpenCapture();
			}
			if (init.video){
				objMicrosoftVideoCapture.OpenCapture(vdoDeviceId);
			}
        
            onOpenCapture.call(source, retMediaCapture);
        };

        this.close = function() {
            objMicrosoftAudioCapture.Cancel();
            objMicrosoftVideoCapture.Cancel();
        };
    }

    if (!window.URL) {
        window.URL = {};
    }

    var nativeCreateURL = null;

    if (window.URL.createObjectURL) {
        nativeCreateURL = window.URL.createObjectURL;
    }

    window.URL.createObjectURL = function (blob) {
        if (blob.mode == "video") {
            return createURLComObject.CreateVideoURL(blob.data);
        }
        else if (blob.mode == "audio") {
            return createURLComObject.CreateAudioURL(blob.data);
        }
        else if (blob.mode == "image") {
            return createURLComObject.CreateImageURL(blob.data);
        }
        else if (blob.mode == "mediastream") {
            currentUrlForPreview = createURLComObject.CreateImageURL(blob.stream.data);
            return currentUrlForPreview;
        }
        else if (nativeCreateURL) {
            return nativeCreateURL.apply(this, arguments);
        };
    }

    if (!window.URL.revokeObjectURL) {
        window.URL.revokeObjectURL = function (url) {
            createURLComObject.RevokeURL(url);
        }
    }

    var showChooseDevicePopup = function () {
        var $dialog = $('#dialog')
            .html('<div style="text-align: center;"><select id="deviceNames" ></select></div><div style="text-align: center; padding-top: 10px;"><input id="deviceConfirm" type="button" value="ok" /><input id="deviceCancel" type="button" value="cancel" /></div>')
			.dialog({
				autoOpen: false,
                modal: true,
				title: 'Please choose video device'
			});

        $('#deviceNames').css({visibility: "visible"});
        $('#deviceConfirm').css({visibility: "visible"});
        $('#deviceCancel').css({visibility: "visible"});

        $('#deviceConfirm')
            .click(function () {
                deviceID = $('#deviceNames option:selected').val();
                device.openCapture(mediaStream, mediaStream.msOnOpenCapture, deviceID);
                $dialog.dialog('close');
            });

        $('#deviceCancel')
            .click(function () {
                deviceID = null;
                $dialog.dialog('close');
            });
        
        // Populates device list.
        $('#deviceNames').empty();

        for (var i = 0; i < videoDevicesCollector.length; i++) {
            $('#deviceNames').append(new Option(videoDevicesCollector[i].name, videoDevicesCollector[i].id));
        }

        $('#deviceNames').show();

        $dialog.dialog('open');
    }

    navigator.msGetUserMedia = function (options, successCb, errorCb) {
        if (options == null) {
            init = { "video": true, "audio": false };
        }
        else {
            init = options;
        }

        // Stream handler
        mediaStream = new MSMediaStream(options);

        window.addEventListener("onbeforeunload", mediaStream.msStop);
        window.addEventListener("onunload", mediaStream.msStop);

        // Result confirm
        var isConfirm = confirm("Would you like to start working with your media devices?");
		var isDevicesFind = false;

        if (successCb != null && typeof (successCb) != "function") {
            ParameterError("successCB");
            return;
        }
        if (successCb == null) {
            ParameterError("successCB");
            return;
        }
        if (errorCb != null && typeof (errorCb) != "function") {
            errorCb = null;
        }

        if (isUnload) {
            return;
        }

		if (isConfirm){
			var result = objMicrosoftNavigatorUserMedia.MsGetUserMedia(init);
			videoDevicesCollector = $.parseJSON(result);

			if (init.video) {
				showChooseDevicePopup();
			}
			else if (init.audio) {
				device.openCapture(mediaStream, mediaStream.msOnOpenCapture);
				successCb(mediaStream);
			}

			currentCallback = successCb;
		}
    }
	
    // StoppableOperation
    var StoppableOperation = function() {
		this.stop;
		this.cancel;
    }

    // PendingOperation
    var PendingOperation = function() {
		this.cancel;
    }
	
	var device = new DeviceCapture();

    window.MSMediaStreamTrackList = function () {
    };

    window.MSMediaStreamTrackList.prototype = Object.create(new Array());
    window.MSMediaStreamTrackList.item = function (index) {
        return this[index];
    }
	
	window.MSMediaStream = function(options) {
        var msEndedListeners = [];
        var mediaOptions = options;
        
        this.tracks = new MSMediaStreamTrackList();
        this.MS_LIVE = 1;           //unsigned short
        this.MS_ENDED = 2;          //unsigned short
        this.msReadyState = 0;      //unsigned short
        this.stream = null;
        this.mode = "mediastream";

        init = options;

        this.msOnOpenCapture = function (capture) {
            if (options.video) {
                if (objMediaCap == undefined) {
                    objMediaCap = capture;
                    isReady = true;
                    objMediaCap.preview(onPreview);
                }
				
				if (videoDevice){
					this.tracks.push(new MSMediaStreamTrack("video", videoDevice, true));
				}
            }

            if (options.audio) {
                if (objAudioCap == undefined) {
                    objAudioCap = capture;
                    isReady = true;
                }
				
				if (audioDevice){
					this.tracks.push(new MSMediaStreamTrack("audio", audioDevice, true));
				}
            }
        };

        this.msStartRecording = function () {
            if (mediaOptions.video) {
                try {
                    if (isReady) {
                        isReady = false;
                        this.msReadyState = this.MS_LIVE;

                        // Used for identification whether additional video convertation (H264) required.
                        videoOptions.onlyVideo = !mediaOptions.audio;

                        recSession = objMediaCap.captureVideo(callbackVideo.onRecordStarted,
					        callbackVideo.onFail,
					        videoOptions,
					        callbackVideo.onRecordCompleted);
                    }
                }
                catch (ex) {
                    alert(ex.message);
                }
            }

            if (mediaOptions.audio) {
                recSessionAudio = objAudioCap.captureAudio(
                    callbackAudio.onRecordStartedAudio,
			        callbackAudio.onFail,
			        audioOptions,
			        onEndpoint,
			        endpointParams);
            }
        };

        this.msStopRecording = function (/*in BlobCallback*/msStopRecordCallback) {

            if (mediaOptions.video) {

                this.msReadyState = this.MS_ENDED;
                Capture.onvideorecordstarted = null;

                if (recSession) {
                    recSession.stop();
                }
            }

            if (mediaOptions.audio) {
                if (recSessionAudio) {
                    recSessionAudio.stop();
                }
            }

            stopRecording = msStopRecordCallback;

            this.dispatchEvent("msended");
        };

        this.msCaptureImage = function (/*in BlobCallback*/successCallback, errorCallback) {
            if (isReady) {
                isReady = false;

                recSession = objMediaCap.captureImage(successCallback, errorCallback, imageOptions);

                isReady = true;
            }
        };

        this.removeEventListener = function (eventName, listener, capture) {
            var i = msEndedListeners.length - 1;
            for (; i >= 0; i--) {
                if (msEndedListeners[i] == listener) {
                    msEndedListeners.splice(i, 1);
                }
            }
        };

        this.addEventListener = function (eventName, listener, capture) {
            this.removeEventListener(eventName, listener, capture);

            if (eventName == "msended") {
                msEndedListeners.push(listener);
            }
        };

        this.dispatchEvent = function (eventName) {
            if (eventName == "msended") {
                for (var i = 0; i < msEndedListeners.length; i++) {
                    var evt = document.createEventObject();
                    evt.srcElement = this;
                    evt.target = this;

                    msEndedListeners[i].call(evt);
                }
            }
        };

        this.msStop = function () {
            isUnload = true;
            this.msReadyState = this.ENDED;

            if (device) {
                for (var i = 0; i < this.tracks.length; i++) {
                    if (this.tracks.item(i).enable) {
                        this.tracks.item(i).enable = false;
                        this.tracks.item(i).label = "";
                        this.tracks.item(i).kind = "";
                    }
                }

                if (objMediaCap) {
                    objMediaCap.onvideofail = null;
                }

                if (objAudioCap) {
                    objAudioCap.onaudiofail = null;
                }

                device.close();
            }
        };
	}
	//Callbacks for audio capture
    var callbackAudio = {
        onRecordStartedAudio: function (stream) {
            if (recSessionAudio) {
                playstream = stream;
            }

            blobCallback(playstream, "audio");
        },

        onFail: function (error) {
            alert(error.toString());
        }
    }
		
	var videoOptions = {
        duration: 0,    // max duration in seconds. Use 0 for record with preview
        limit: 1,       // only need one recording
        onlyVideo: true
    }
        
	var callbackVideo = {
        onRecordStarted: function (stream) {
            if (recSession) {
                isReady = true;
                vdoBlob = null;

                //Refresh preview window
                render(stream, currentIdForPreview);
            }
        },

        onRecordCompleted: function (blob) {
            isReady = true;
            blob.mode = "video";
            vdoBlob = blob;

            if (!videoBlobUrl) {
                videoBlobUrl = createURLComObject.CreateVideoURL(blob.data);
            }

            if (urlAudio || !init.audio) {
                blobCallback();
            }
        },

        onFail: function (error) {
            isReady = false;
            alert(error.toString());
        }
    }
		
    var onPreview = function (stream) {
        if (currentUrlForPreview) {
            // User started preview

            // Initializing dom element by preview for current stream
            if (!domElementId) {
                domElementId = searchIdbySrc(document);
            }

            currentIdForPreview = domElementId;
            render(stream, domElementId);
        }
        else {
            // If camera started but user don't start preview
            mediaStream.stream = stream;
            currentCallback(mediaStream);
        }
    }
    return {		
        // Media Capture
        Capture : function() {

            // captureAudio API
            this.captureAudio = function (successCB, errorCB, audioOptions, endCB, endpointParams) {

                // Validate the parameters
                if (typeof (successCB) != "function") {
                    ParameterError("successCB");
                }
        
                if (errorCB != undefined && typeof (errorCB) != "function") {
                    ParameterError("errorCB");
                }

                if (audioOptions != undefined) {

                    if( typeof (audioOptions) != "object") {
                        ParameterError("audioOptions");
                    }
         
                    if (typeof (audioOptions.duration) != "number") {
                        ParameterError("audioOptions.duration");
                    }

                    if (typeof (audioOptions.limit) != "number") {
                        ParameterError("audioOptions.limit");
                    }

                    if (typeof (audioOptions.mode) != "object") {
                        ParameterError("audioOptions.mode");
                    }
                }
                else {
                    // use default values
                    audioOptions = { duration: 30, limit: 1, mode: { type: "audio/x-wav"} };
                }

                if (endCB != undefined && typeof (endCB) != "function") {
                    ParameterError("endCB");
                }

                if (endpointParams != undefined) {

                    if( typeof (endpointParams) != "object") {
                        ParameterError("endpointParams");
                    }

                    if (typeof (endpointParams.sensitivity) != "number") {
                        ParameterError("endpointParams.sensitivity");
                    }

                    if (typeof (endpointParams.initialTimeout) != "number") {
                        ParameterError("endpointParams.initialTimeout");
                    }

                    if (typeof (endpointParams.endTimeout) != "number") {
                        ParameterError("endpointParams.endTimeout");
                    }
                }
                else {
                    // use default values
                    endpointParams = { sensitivity: 0.5, endTimeout: 2000, initialTimeout: 500 };
                }

                Capture.onaudiorecordstarted = successCB;
                Capture.onaudiofail = errorCB;
                Capture.endpoint = endCB;
                objMicrosoftAudioCapture.CaptureAudio(audioOptions.duration, audioOptions.limit, audioOptions.mode, endpointParams.sensitivity, endpointParams.initialTimeout, endpointParams.endTimeout);
        
                var recSession = new StoppableOperation();

                recSession.stop = function() {
                    objMicrosoftAudioCapture.Stop();
                };

                recSession.cancel = function() {
                    objMicrosoftAudioCapture.Cancel();
                };

                return recSession;
            };

            // captureVideo API
            this.captureVideo = function (successCB, errorCB, videoOptions, completedCB) {

                // Validate the parameters
                if (typeof (successCB) != "function") {
                    ParameterError("successCB");
                }
        
                if (errorCB != undefined && typeof (errorCB) != "function") {
                    ParameterError("errorCB");
                }

                if (completedCB != undefined && typeof (completedCB) != "function") {
                    ParameterError("completedCB");
                }

                if (videoOptions != undefined) {

                    if (typeof (videoOptions) != "object") {
                        ParameterError("videoOptions");
                    }

                    if (typeof (videoOptions.duration) != "number") {
                        ParameterError("videoOptions.duration");
                    }

                    if (typeof (videoOptions.limit) != "number") {
                        ParameterError("videoOptions.limit");
                    }
                }
                else {
                    // use default values
                    videoOptions = { duration: 30, limit: 1 };
                }

                Capture.onvideorecordstarted = successCB;
                Capture.onvideorecordcompleted = completedCB;
                Capture.onvideofail = errorCB;

                if (videoOptions.onlyVideo) {
                    objMicrosoftVideoCapture.CaptureVideo(
                        videoOptions.duration,
                        videoOptions.limit,
                        videoOptions.onlyVideo);
                }
                else {
                    // if onlyVideo is absent it's considered to be false.
                    objMicrosoftVideoCapture.CaptureVideo(
                        videoOptions.duration,
                        videoOptions.limit,
                        false);
                }

                var recSession = new StoppableOperation();

                recSession.stop = function() {
                    objMicrosoftVideoCapture.Stop();
                };

                recSession.cancel = function() {
                    objMicrosoftVideoCapture.Cancel();
                };

                return recSession ;
            };

            // captureImage API
            this.captureImage = function (successCB, errorCB, imageOptions) {

                // Validate the parameters
                if (typeof (successCB) != "function") {
                    ParameterError("successCB");
                }
        
                if (errorCB != undefined && typeof (errorCB) != "function") {
                    ParameterError("errorCB");
                }

                if (imageOptions != undefined) {

                    if (typeof (imageOptions) != "object") {
                        ParameterError("imageOptions");
                    }

                     if (typeof (imageOptions.width) != "number") {
                        ParameterError("imageOptions.width");
                    }

                     if (typeof (imageOptions.height) != "number") {
                        ParameterError("imageOptions.height");
                    }

                    if (typeof (imageOptions.imageFormat) != "string") {
                        ParameterError("imageOptions.imageFormat");
                    }
                }
                else {
                    // use default values
                    imageOptions = { width: 800, height: 600, imageFormat: "jpg" };
                }

                Capture.onsnapshottaken = successCB;
                Capture.onvideofail = errorCB;

                objMicrosoftVideoCapture.CaptureImage(imageOptions.width, imageOptions.height, imageOptions.imageFormat);

                var recSession = new PendingOperation();

                recSession.cancel = function() {
                    objMicrosoftVideoCapture.Cancel();
                };

                return recSession;
            };

            // video preview
            this.preview = function(onPreview) {
                Capture.onpreview = onPreview;
                objMicrosoftVideoCapture.StartPreview();
            };

			function objMicrosoftAudioCapture::SoundDeviceDetectionSuccess(device) {
				if (mediaStream){
					mediaStream.tracks.push(new MSMediaStreamTrack("audio", device, true));
				}
				else{
					audioDevice = device;
				}
			}		
			
            function objMicrosoftAudioCapture::RecordStarted(stream) {
                if (Capture.onaudiorecordstarted != undefined) {
                    var retStream = new Stream();
                    retStream.data = stream;
                    Capture.onaudiorecordstarted(retStream);
                }
            }

            function objMicrosoftAudioCapture::Fail(code, errMsg) {
                if (Capture.onaudiofail != undefined) {
                   var objError = new CaptureError(code);
                   Capture.onaudiofail(objError);
                }
            }

            function objMicrosoftAudioCapture::Endpoint(endevent) {
                if (Capture.onendpoint != undefined) {
                    Capture.onendpoint(endevent);
                }
            }
			
			function objMicrosoftVideoCapture::VideoDeviceSelected(device) {
				if (mediaStream){
					mediaStream.tracks.push(new MSMediaStreamTrack("video", device, true));
				}
				else{
					videoDevice = device;
				}
			}
			
            function objMicrosoftVideoCapture::RecordStarted(stream) {
                if (Capture.onvideorecordstarted != undefined) {
                    var retStream = new Stream();
                    retStream.data = stream;
                    Capture.onvideorecordstarted(retStream);
                }
            }

            function objMicrosoftVideoCapture::Fail(code, errMsg) {
                if (Capture.onvideofail != undefined) {
                    var objError = new CaptureError(code);
                    Capture.onvideofail(objError);
                }
            }

            function objMicrosoftVideoCapture::RecordCompleted(blob) {
                if (Capture.onvideorecordcompleted != undefined) {
                    var retBlob = new Blob();
                    retBlob.data = blob;
                    Capture.onvideorecordcompleted(retBlob);
                }
            }

            function objMicrosoftVideoCapture::Preview(stream) {
                if (Capture.onpreview != undefined) {
                    var retStream = new Stream();
                    retStream.data = stream;
                    Capture.onpreview(retStream);
                }
            }

            function objMicrosoftVideoCapture::SnapShotTaken(blob) {
                if (Capture.onsnapshottaken != undefined) {
                    var retBlob = new Blob();
                    retBlob.data = blob;
                    retBlob.mode = "image";
                    Capture.onsnapshottaken(retBlob);
                }
            }

            retMediaCapture = this;
        }	
    }
} ();

function MSMediaStreamTrack(kind, label, enable) {
    this.msKind = kind;
    this.msLabel = label;
    this.msEnabled = enable;
};
