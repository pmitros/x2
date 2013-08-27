/*

 An HTML5 canvas for drawing

 */


function capture_widget(init){

    var canvas_id = init.jqid


    var lmb_down = false
    var inline = false
    var last_point;
    var last_timestamp = 0;
    var modes = {'point': 1, 'line': 2}
    var mode = modes['point']
    nevt = 0
    runavg = 0

    var PEN = false // pointer enabled device

    var PRESSURE_COLOR = false
    var PRESSURE_WIDTH = true
    var PRESSURE_WEIGHT = 1

    CURVES = []
    curcurv = []
    collecting = false

    var CAPTURE

    function get_point(evt) {

        pt = {
            x: relx(evt),
            y: rely(evt),
            timestamp: time()
        }

        if (PEN) {
            pt.pressure = evt.pressure
        }

        return pt
    }

    function get_ctx() {
        return $('#canv').get(0).getContext('2d');
    }

    function time() {
        var d = new Date();
        return d.getTime();
    }

    function drawLine(from, to, lineColor, lineWidth) { //todo pass dictionary
        var ctx = get_ctx()
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);

        ctx.strokeStyle = (lineColor == undefined) ? '#333' : lineColor
        ctx.lineWidth = (lineWidth == undefined) ? 2 : lineWidth
        ctx.lineCap = 'round'

        ctx.stroke();
    }


    function draw_point(coord) {
        var ctx = get_ctx()
        ctx.beginPath();
        ctx.fillStyle = '#222'
        ctx.fillRect(coord.x - 1, coord.y - 1, 3, 3)
    }


    function resize_canvas() {
        var iw = $(window).width();
        var ih = $(window).height();

        $('#canv')[0].width = 0.9 * iw
        $('#canv')[0].height = 0.8 * ih
    }


    function relx(event) {
        return event.pageX - $("#canv").offset().left  //TODO compute statitically
    }

    function rely(event) {
        return event.pageY - $("#canv").offset().top  //TODO compute statitically
    }

    function point_to_list(p) {
        pt = [Math.round(10 * p.x) / 10, Math.round(10 * p.y) / 10, p.timestamp]
        if (p.pressure != undefined) {
            pt.push(Math.round(p.pressure * 1000) / 1000)
        }
        return pt
    }


    function info_update(tm, draw) {
        if (last_timestamp > 0) {

            delta = tm - last_timestamp;
            eps = 1000 / delta
            runavg = (runavg * nevt + eps) / (nevt + 1)
            nevt = nevt + 1

            $("#perf").text(Math.round(eps))
            $("#runavg").text(Math.round(runavg))
            $("#draw").text(Math.round(draw))
        }

        last_timestamp = tm;
    }


    function on_mousedown(event) {
        event.preventDefault()
        lmb_down = true
        inline = true
        //console.log('mousedown')
        curcurv = [] // start a new curve
        last_point = get_point(event)

        if (mode == modes.point) {
            draw_point(last_point)
        }

        if (collecting) {
            curcurv.push(point_to_list(last_point))
        }

    }
    function on_mousemove(event) {
        tm = time()
        if (lmb_down) {
            cur_point = get_point(event)

            if (mode == modes.point) {
                draw_point(cur_point)
            }
            else if (mode == modes.line) {
                if (PEN) {
                    avg_pressure = 0.5 * (last_point.pressure + cur_point.pressure)

                    if (PRESSURE_COLOR) {
                        alpha = (1 - PRESSURE_WEIGHT) + PRESSURE_WEIGHT * avg_pressure
                        color = 'rgba(32,32,32,' + alpha + ')'
                    }
                    else {
                        color = 'rgba(64,64,64,1)'
                    }

                    if (PRESSURE_WIDTH) {
                        width = 1 + Math.round(4 * avg_pressure)
                    }
                    else {
                        width = 2
                    }

                    drawLine(cur_point, last_point, color, width)
                }
                else {
                    drawLine(last_point, cur_point)
                }

            }
            else {
                alert("unknown drawing mode")
            }

            //

            last_point = cur_point
            info_update(tm, time() - tm)

            if (collecting) {
                curcurv.push(point_to_list(last_point))
            }

        }
        event.preventDefault()
    }
    function on_mouseup(event) {
        event.preventDefault()

        if (lmb_down && collecting) {
            CURVES.push(curcurv)
        }

        lmb_down = false
        inline = false
        last_timestamp = 0

        //console.log('mouseup')

    }


    function norm_time(curves) {

        if (curves.length > 0) {
            time_zero = curves[0][0][2]
            for (i = 0; i < curves.length; i++) {
                for (j = 0; j < curves[i].length; j++) {
                    curves[i][j][2] -= time_zero
                }
            }
        }
        return curves
    }

    function replay(capture) {

        for (i = 0; i < capture.length; i++) {
            curve = capture[i]

            for (j = 1; j < curve.length; j++) {
                point = curve[j]
                from = {}
                to = {}
                from.x = curve[j - 1][0]
                from.y = curve[j - 1][1]
                to.x = curve[j][0]
                to.y = curve[j][1]

                drawLine(from, to)
            }
        }
    }


    function ie10_pointer() {
        var ie10 = /MSIE (\d+)/.exec(navigator.userAgent)

        if (ie10 != null) {

            version = parseInt(ie10[1])
            if (version >= 10) {
                ie10 = true
            }
            else {
                ie10 = false
            }
        }
        else {
            ie10 = false
        }

        var pointer = navigator.msPointerEnabled ? true : false

        if (ie10 && pointer) {
            return true
        }
        else {
            return false
        }
    }

    function rough() {
        replay(CAPTURE)
    }


    function widget_init() {

        PEN = ie10_pointer()

        console.log(PEN ? 'Pointer Enabled Device' : 'Pointer Disabled Device')


        if (PEN) {
            canvas = document.getElementById('canv');
            canvas.addEventListener("MSPointerUp", on_mouseup, false);
            canvas.addEventListener("MSPointerMove", on_mousemove, false);
            canvas.addEventListener("MSPointerDown", on_mousedown, false);
        }
        else {
            $('#canv').mousedown(on_mousedown)
            $('#canv').mousemove(on_mousemove)
            $(window).mouseup(on_mouseup)
        }


        //$(window).resize(resize_canvas)

        /*
         //ignore touch events for now
         canvas = $("#canv")[0]
         canvas.addEventListener('touchstart', on_mousedown, false);
         canvas.addEventListener('touchmove', on_mousemove, false);
         window.addEventListener('touchend', on_mouseup, false);

         */

        resize_canvas();
    }

    //Initialize the widget
    widget_init()

    /* *************************************************************************
     *  Public Methods
     * *************************************************************************/

    this.on_clear = function(){
        var ctx = get_ctx()
        ctx.clearRect(0, 0, $("#canv").width(), $("#canv").height())

        nevt = 0
        runavg = 0
    }

    this.start_collecting = function() {
        collecting = true;
    }

    this.stop_collecting = function(){
        collecting = false
        CURVES = norm_time(CURVES)
        console.log(JSON.stringify(CURVES))
    }

    this.interpolation_mode = function(mode_str){
        mode = modes[mode_str]
    }

}


