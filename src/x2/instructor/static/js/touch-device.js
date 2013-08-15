var TouchDevice = function() {

    function init(){
        // is_touch_device();
        document.addEventListener("touchstart", touchHandler, true);
        document.addEventListener("touchmove", touchHandler, true);
        document.addEventListener("touchend", touchHandler, true);
        document.addEventListener("touchcancel", touchHandler, true);
    }

    function is_touch_device() {
        // alert("ontouchstart:" + !!('ontouchstart' in window) + " onmsgesturechange:" + !!('onmsgesturechange' in window));
        return !!('ontouchstart' in window) // works on most browsers 
          || !!('onmsgesturechange' in window); // works on ie10
    }

    // http://stackoverflow.com/questions/5186441/javascript-drag-and-drop-for-touch-devices
    function touchHandler(event) {
        var touch = event.changedTouches[0];

        var simulatedEvent = document.createEvent("MouseEvent");
            simulatedEvent.initMouseEvent({
            touchstart: "mousedown",
            touchmove: "mousemove",
            touchend: "mouseup"
        }[event.type], true, true, window, 1,
            touch.screenX, touch.screenY,
            touch.clientX, touch.clientY, false,
            false, false, false, 0, null);

        touch.target.dispatchEvent(simulatedEvent);
        event.preventDefault();
    }

    return {
        init: init
    };
}();
