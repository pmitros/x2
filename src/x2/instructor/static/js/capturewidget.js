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

    this.relative_point = function(event){
        pt = {
            x: event.pageX - $(canvas_id).offset().left, // todo fix if canvas not in corner
            y: event.pageY - $(canvas_id).offset().top,
            t: time()
        }

        return pt
    }


    this.resize_canvas = function() {
        var iw = $(window).width();
        var ih = $(window).height();

        $(canvas_id)[0].width = 0.9 * iw
        $(canvas_id)[0].height = 0.8 * ih
    }

    this.get_ctx = get_ctx;

    this.transform = function(mat) {
        var ctx = get_ctx();
        ctx.transform(mat.m11, mat.m12, mat.m21, mat.m22, mat.dx, mat.dy)
    }
}

// smart_paint_widget wraps paint_widget to modify the drawing primitives
// according to advanced input such as pressure
function smart_paint_widget(canvas_id){

    var canvas = new paint_widget(canvas_id)
    var pressure_color = false  // Change color of strokes dep on pressure?
    var pressure_width = true  // Change width of strokes dep on pressure?
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

    this.relative_point = function(event){
        pt = canvas.relative_point(event)
        pt.pressure  = event.pressure
        return pt
    }

    this.draw_point = canvas.draw_point
    this.clear = canvas.clear
    this.resize_canvas = canvas.resize_canvas
    this.get_ctx = canvas.get_ctx;
    this.transform = canvas.transform;
}


/* *****************************************************************************
 *  capture_widget captures and displays input
 * ****************************************************************************/

function capture_widget(init){

    var canvas_dom_id = init.canvas_id
    var canvas_id = '#' + canvas_dom_id
    var canvas // drawing widget

    var recording_start_time;
    var recording_stop_time;
    var is_recording = false;

    var LMB = 1;
    var MMB = 2;
    var RMB = 3;

    var TOUCH = 2;

    var lmb_down = false
    var inline = false
    var last_point;

    var pan_last_point;

    var VisualTypes = {
        dots: 'dots',  // todo use ints to speed up?
        stroke: 'stroke'
    }
    var active_visual_type = VisualTypes['stroke']


    var PEN = false // pointer enabled device


    VISUALS = []
    var current_visual;


    function empty_visual(){
        return {
            type: '',
            doesItGetDeleted: false,
            tDeletion: 0,
            tEndEdit: 0,
            tMin: 0,
            properties:[],
            vertices:[]
        }
    }

    function on_mousedown(event) {
        event.preventDefault()
        if (! is_recording){return;}

        if(event.which == MMB){
            return on_pan_start(event);
        }

        if(PEN && event.pointerType == TOUCH){
            return on_pan_start(event);
        }

        lmb_down = true
        inline = true
        //console.log('mousedown')

        current_visual = empty_visual()
        current_visual.type = active_visual_type
        last_point = canvas.relative_point(event)

        current_visual.vertices.push(last_point)

        if (active_visual_type == VisualTypes.dots) {
            canvas.draw_point(last_point)
        }

    }
    function on_mousemove(event) {
        //event.preventDefault()

        console.log(event.pointerType)

        if (! is_recording){return;}

        if(event.which == MMB){
            return on_pan_move(event);
        }

        if(PEN && event.pointerType == TOUCH){
            return on_pan_move(event);
        }

        if (lmb_down) {
            cur_point = canvas.relative_point(event)

            if (active_visual_type == VisualTypes.dots) {
                canvas.draw_point(cur_point)
            }
            else if (active_visual_type == VisualTypes.stroke) {
                canvas.draw_line({
                        from: cur_point,
                        to: last_point
                    })
            }
            else {
                alert("unknown drawing mode")
            }

            last_point = cur_point
            current_visual.vertices.push(last_point)
        }

    }
    function on_mouseup(event) {
        event.preventDefault()
        if (! is_recording){return;}

        if(event.which == MMB){
            return;
        }

        if(PEN && event.pointerType == TOUCH){
            return on_pan_end(event);
        }
        if (lmb_down) {
            VISUALS.push(current_visual)
        }

        lmb_down = false
        inline = false

        //console.log('mouseup')

    }

    function on_pan_start(event){
        pan_last_point = canvas.relative_point(event);

    }

    function translation_matrix(dx,dy){

        // a c e          m11  m21  dx
        // b d f          m12  m22  dy
        // 0 0 1           0    0   1

        return {
            m11: 1,  //a
            m12: 0,  //b
            m21: 0,  //c
            m22: 1,  //d
            dx: dx,  //e
            dy: dy   //f
        }
    }

    function on_pan_move(event){
        if((time() - pan_last_point.t) < 50){
            return;
        }
        var cur_point = canvas.relative_point(event);

        var dx = cur_point.x - pan_last_point.x;
        var dy = cur_point.y - pan_last_point.y;

        var mat = translation_matrix(dx,dy);
        var ctx = canvas.get_ctx();
       // ctx.save()
        //canvas.transform(mat)
        canvas.clear();
        ctx.translate(dx,dy);
        draw_visuals(VISUALS)
       // ctx.restore();


        pan_last_point = cur_point;




        //console.log('panning', canvas.relative_point(event))
    }

    function on_pan_end(event){
        return on_pan_move(event);
    }


    function draw_visuals(visuals){
        for (var i=0; i<visuals.length; i++){
            var visual = visuals[i]

            if (visual.type == VisualTypes.dots){
                for(var j=0; j<visual.vertices.length; j++){
                    var vertex = visual.vertices[j]
                    canvas.draw_point(vertex)
                }
            }
            else if(visual.type == VisualTypes.stroke){
                for(var j=1; j<visual.vertices.length; j++){
                    var from = visual.vertices[j-1]
                    var to = visual.vertices[j]
                    var line = {
                        from: from,
                        to: to
                    }
                    canvas.draw_line(line)
                }
            }
            else {
                console.log('unknown visual type')
            }
        }
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


    function export_recording_to_pentimento_format(){

        console.log('start export to pentimento')
        var canvas_height = $(canvas_id).height()
        var canvas_width = $(canvas_id).width()

        var result = {
            pageFlips: undefined,
            visuals: undefined,
            cameraTransforms: undefined,
            height: canvas_height,
            width: canvas_width,
            durationInSeconds: (recording_stop_time - recording_start_time)/1000
        }


        //pageFlips
        result.pageFlips = []
        result.pageFlips[0] = {
            page: 1,
            time: -100000.0
        }

        //cameraTransforms
        result.cameraTransforms=[]
        result.cameraTransforms[0] = {
            tx: 0.0,
            ty: 0.0,
            m21: 0.0,
            m22: 1.0,
            m11: 1.0,
            m12: 0.0,
            time: -100.0
        }

        result.cameraTransforms[0] = {
            tx: 0.0,
            ty: 0.0,
            m21: 0.0,
            m22: 1.0,
            m11: 1.0,
            m12: 0.0,
            time: 3.0
        }

        result.cameraTransforms[1] = {
            tx: 250.0,
            ty: -250.0,
            m21: 0.0,
            m22: 1.0,
            m11: 1.0,
            m12: 0.0,
            time: 4.0001
        }

        result.cameraTransforms[2] = {
            tx: 500.0,
            ty: -500.0,
            m21: 0.0,
            m22: 1.0,
            m11: 1.0,
            m12: 0.0,
            time: 5.0
        }

        //visuals
        result.visuals = []


        for (var i=0; i<VISUALS.length; i++){
            if (VISUALS[i].type == VisualTypes.stroke){

                var v = {}
                v.type = 'stroke'
                v.tDeletion = 0
                v.tMin = (VISUALS[i].vertices[0].t - recording_start_time)/1000
                var nverts = VISUALS[i].vertices.length
                v.tEndEdit = (VISUALS[i].vertices[nverts-1].t - recording_start_time)/1000
                v.doesItGetDeleted = false
                v.properties = []
                v.properties[0] = {
                    red: 0,
                    green: 0,
                    blue: 0,
                    alpha: 1,
                    redFill: 0,
                    blueFill: 0,
                    greenFill: 0,
                    alphaFill: 1,
                    thickness: 10,
                    time: v.tEndEdit - v.tMin,
                    type: 'basicProperty'
                }

                v.vertices = []
                for (var j=0; j<VISUALS[i].vertices.length; j++){

                    var vertex = {
                        x: VISUALS[i].vertices[j].x,
                        y: canvas_height - VISUALS[i].vertices[j].y,
                        t: (VISUALS[i].vertices[j].t - recording_start_time)/1000,
                        pressure: (VISUALS[i].vertices[j].pressure == undefined)? 0.8 : VISUALS[i].vertices[j].pressure
                    }

                    v.vertices.push(vertex)
                }

                result.visuals.push(v)
            }
            else {
                console.log('skipping unsupported pentimento visual type: ' + visual.type)
            }
        }

        console.log('end export to pentimento')
        return result
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

        if (PEN) {
            console.log('Pointer Enabled Device')
            canvas = new smart_paint_widget(canvas_id)

            c = document.getElementById(canvas_dom_id);
            c.addEventListener("MSPointerUp", on_mouseup, false);
            c.addEventListener("MSPointerMove", on_mousemove, false);
            c.addEventListener("MSPointerDown", on_mousedown, false);
        }
        else {
            console.log('Pointer Disabled Device')
            canvas = new paint_widget(canvas_id)
            $(canvas_id).mousedown(on_mousedown)
            $(canvas_id).mousemove(on_mousemove)
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

       canvas.resize_canvas();
    }

    //Initialize the widget
    widget_init()

    /* *************************************************************************
     *  Public Methods
     * *************************************************************************/


    // Erases the entire canvas
    this.clear = function(){
        canvas.clear()
    }

    // Starts recording of strokes
    this.start_collecting = function() {

    }

    // Stops recording of strokes and prints them
    this.stop_collecting = function(){

    }

    // Change the interpolation mode
    this.set_active_visual_type = function(type_str){
        active_visual_type = VisualTypes[type_str]
    }

    this.draw_all=function(){
        draw_visuals(VISUALS)
    }

    this.undo=function(){

        if(VISUALS.length > 0){
            VISUALS.pop()
            canvas.clear()
            draw_visuals(VISUALS)
        }

    }

    this.get_recording = function(){
        var pentimento_record = export_recording_to_pentimento_format()
        return pentimento_record
    }

    this.start_recording = function (){
        is_recording = true;
        recording_start_time = time();
    }

    this.stop_recording = function(){
        is_recording = false;
        recording_stop_time = time();
    }

}


