try {
    // ActiveX Objects For Media Capture and Speech API Prototype
    var objMicrosoftAudioCapture = new ActiveXObject("Microsoft.HTML.MediaCaptureAPIEx.AudioCaptureEx");
    var objMicrosoftVideoCapture = new ActiveXObject("Microsoft.HTML.MediaCaptureAPIEx.VideoCaptureEx");
    var objMicrosoftHttpRequest = new ActiveXObject("Microsoft.HTML.MediaCaptureAPIEx.XmlHttpRequestEx");
    var objMicrosoftSpeechRecognizer = new ActiveXObject("Microsoft.HTML.MediaCaptureAPIEx.SpeechRecognizer"); 
    var objMicrosoftSpeechSynthesizer = new ActiveXObject("Microsoft.HTML.MediaCaptureAPIEx.SpeechSynthesizer");
	var objMicrosoftNavigatorUserMedia = new ActiveXObject("Microsoft.HTML.MediaCaptureAPIEx.NavigatorUserMedia");
	var objMicrosoftVideoAndAudioRemuxer = new ActiveXObject("Microsoft.HTML.MediaCaptureAPIEx.VideoAndAudioRemuxer");
	var createURLComObject = new ActiveXObject("Microsoft.HTML.CreateURL.CreateURL");	
	var playMediaObject = new ActiveXObject("Microsoft.HTML.PlayBackStream.PlayBackStream");
}
catch (ex) {
    alert("Failed to load Media Capture API plugin: { " + ex.message + " }");
}