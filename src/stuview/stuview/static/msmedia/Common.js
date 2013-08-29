
// Encapsulates errors in Capture API
CaptureError = function (err) {
    this.code = err;

    this.toString = function () {
        switch (this.code) {
            case 0:
                return "Internal error occured.";

            case 1:
                return "Input device is in use by another application.";

            case 2:
                return "Invalid argument passed.";

            case 3:
                return "User cancelled the operation.";
        }
    };
};

// placeholder for Stream type
Stream = function(data) {
    this.data;
};

// placeholder for Blob type
Blob = function(data) {
    this.data;
};

// Default handler for media capture API errors.
function defOnError(error) {
    alert(error.toString());
}

// SpeechRecognitionResult
function SpeechRecognitionResult() {
    this.utterance;
    this.confidence = 0;
    this.interpretation;
}

// SpeechRecognitionResultCollection
function SpeechRecognitionResultCollection() {
    this.speechRecognitionResult = new SpeechRecognitionResult();
    this.responseEMMAXML;
    this.responseEMMAText;
    this.length = 0;

    this.item = function (index) {
        if (typeof (this.speechRecognitionResult[index]) != "undefined") {
            return this.speechRecognitionResult[index];
        }
        else {
            return null;
        }
    }

    this.add = function add(recognitionResult) {
        this.speechRecognitionResult[this.length] = recognitionResult;
        ++this.length;
    }

    this.feedbackcorrection = function (correctUtterance) {
        objSpeechRecognitionResultCollection.feedbackcorrection(correctUtterance);
    };

    this.feedbackselection = function (index) {
        objSpeechRecognitionResultCollection.feedbackselection(index);
    };
}

function ParameterError(variable) {
    throw new TypeError("Parameter " + variable + " type is incorrect");
}

CustomXMLHttpRequest = function() {
    this.multipart;
    this.responseparts;
    this.onpartreceived;
    this.method;
    this.url;
    this.header;
    this.content;
    this.contentType;

    // Open request
    this.open = function(method, url, async) {

        // Validate the parameters
        if (typeof (method) != "string") {
            ParameterError("method");
            return;
        }

        if (typeof (url) != "string") {
            ParameterError("url");
            return;
        }

        if (typeof (async) != "boolean") {
            ParameterError("async");
            return;
        }

        objMicrosoftHttpRequest.Open(method, url, async, "", "");
    };

    // Send the stream
    this.send = function(stream) {

        // Validate the parameters
        if (typeof (stream) != "object") {
            ParameterError("stream");
            return;
        }

        CustomXMLHttpRequest.onpartreceived = this.onpartreceived;
        objMicrosoftHttpRequest.Send(stream);
    };

    // Stop request
    this.stop = function() {
        objMicrosoftHttpRequest.Stop();
    };

    // Event Handlers
    function objMicrosoftHttpRequest::ResponseReceiveEvent(responseCollection) {
        if (CustomXMLHttpRequest.onpartreceived != undefined) {
            CustomXMLHttpRequest.onpartreceived(responseCollection);
        }
    }

    // Function to set javascript properties
    this.SetCaptureProperties = function Capture_setCaptureProperties() {
        CustomXMLHttpRequest.onpartreceived = this.onpartreceived;
    };
};

// ResponsePart
function ResponsePart() {
    this.mimeType;
    this.encoding;
    this.blobPart;
    this.textPart;
    this.XMLPart;
}