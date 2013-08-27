/*

 An HTML5 canvas for drawing and capturing

 */


// get a timestamp
function time() {
    var d = new Date();
    return d.getTime();
}


// paint_widget encapsulates drawing primitives for HTML5 canvas
function paint_widget(canvas_id){

    var canvas_id = canvas_id
    var default_line_color = '#333'
    var default_line_width = 2
    var default_point_color = '#222'

    function get_ctx() {
        return $(canvas_id).get(0).getContext('2d'); // todo replace with static ctx?
    }

     this.draw_line = function(line) {
         /*
            line = {
                from: point,
                to: point,
                color: string  // optional
                width: int    // optional
            }
          */
        var ctx = get_ctx()
        ctx.beginPath();
        ctx.moveTo(line.from.x, line.from.y);
        ctx.lineTo(line.to.x, line.to.y);

        ctx.strokeStyle = (line.color == undefined) ? default_line_color : line.color
        ctx.lineWidth = (line.width == undefined) ? default_line_width : line.width
        ctx.lineCap = 'round'

        ctx.stroke();
    }

    this.draw_point = function(coord) {
        var ctx = get_ctx()
        ctx.beginPath();
        ctx.fillStyle = default_point_color
        ctx.fillRect(coord.x - 1, coord.y - 1, 3, 3)
    }

    this.clear = function(){
        var ctx = get_ctx()
        ctx.clearRect(0, 0, $(canvas_id).width(), $(canvas_id).height())
    }
}

// smart_paint_widget wraps paint_widget to modify the drawing primitives
// according to advanced input such as pressure
function smart_paint_widget(canvas_id){

    var canvas = new paint_widget(canvas_id)
    var pressure_color = false  // Change color of lines dep on pressure?
    var pressure_width = true  // Change width of lines dep on pressure?
    var max_extra_line_width = 4

    this.draw_line = function(line) {

        /*
            line = {
               from: point,
               to: point,
               ...
            }
         */

        avg_pressure = 0.5 * (line.from.pressure + line.to.pressure)

        if (pressure_color) {
            alpha = (1 - 0.5) + 0.5 * avg_pressure
            line.color = 'rgba(32,32,32,' + alpha + ')' // todo use defaults
        }
        else {
            line.color = 'rgba(64,64,64,1)'  // todo use defaults
        }

        if (pressure_width) {
            line.width = 1 + Math.round(max_extra_line_width * avg_pressure) // todo use defaults
        }
        else {
            line.width = 2 // todo use defaults
        }

        canvas.draw_line(line)
    }

    this.draw_point = canvas.draw_point
    this.clear = canvas.clear
}


/* *****************************************************************************
 *  capture_widget captures and displays input
 * ****************************************************************************/

function capture_widget(init){

    var canvas_dom_id = init.canvas_id
    var canvas_id = '#' + canvas_dom_id
    var canvas // drawing widget

    var lmb_down = false
    var inline = false
    var last_point;
    var last_timestamp = 0;
    var modes = {'point': 1, 'line': 2}
    var mode = modes['point']
    nevt = 0
    runavg = 0

    var PEN = false // pointer enabled device // todo is necessary?



    CURVES = []
    curcurv = []
    collecting = false

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

    function resize_canvas() {
        var iw = $(window).width();
        var ih = $(window).height();

        $(canvas_id)[0].width = 0.9 * iw
        $(canvas_id)[0].height = 0.8 * ih
    }


    function relx(event) {
        return event.pageX - $(canvas_id).offset().left  //TODO compute statitically
    }

    function rely(event) {
        return event.pageY - $(canvas_id).offset().top  //TODO compute statitically
    }

    function point_to_list(p) {
        pt = [Math.round(10 * p.x) / 10, Math.round(10 * p.y) / 10, p.timestamp]
        if (p.pressure != undefined) {
            pt.push(Math.round(p.pressure * 1000) / 1000)
        }
        return pt
    }


    function info_update(tm) {
        if (last_timestamp > 0) {

            delta = tm - last_timestamp;
            eps = 1000 / delta
            runavg = (runavg * nevt + eps) / (nevt + 1)
            nevt = nevt + 1

            $("#perf").text(Math.round(eps))
            $("#runavg").text(Math.round(runavg))
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
            canvas.draw_point(last_point)
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
                canvas.draw_point(cur_point)
            }
            else if (mode == modes.line) {
                canvas.draw_line({
                        from: cur_point,
                        to: last_point
                    })
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


    // Returns true if this Internet Explorer 10 or greater running on a device
    // with msPointer events enabled (like the surface pro)
    function ie10_tablet_pointer() {
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


    // Initialize the widget (this function is called right after it is defined)
    function widget_init() {

        PEN = ie10_tablet_pointer()
        console.log(PEN ? 'Pointer Enabled Device' : 'Pointer Disabled Device')


        if (PEN) {
            canvas = new smart_paint_widget(canvas_id)
            c = document.getElementById(canvas_dom_id);
            c.addEventListener("MSPointerUp", on_mouseup, false);
            c.addEventListener("MSPointerMove", on_mousemove, false);
            c.addEventListener("MSPointerDown", on_mousedown, false);
        }
        else {
            canvas = new paint_widget(canvas_id)
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


    // Erases the entire canvas
    this.clear = function(){
        canvas.clear()

        nevt = 0
        runavg = 0
    }


    // Starts recording of strokes
    this.start_collecting = function() {
        collecting = true;
    }

    // Stops recording of strokes and prints them
    this.stop_collecting = function(){
        collecting = false
        CURVES = norm_time(CURVES)
        console.log(JSON.stringify(CURVES))
    }

    // Change the interpolation mode
    this.interpolation_mode = function(mode_str){
        mode = modes[mode_str]
    }

}


