// Classroom Layout 

var Layout = function() {
    var course_id = "";
    var session_id = "";
    var blocks = [];
    var students = [];

    function init(course, session, blocks, students, readonly){
        Layout.course_id = course;
        Layout.session_id = session;
        Layout.blocks = blocks;
        Layout.students = students;
        bindEvents();
        console.log("Layout initialized", course, session, blocks, students);
        load_blocks(readonly);
        load_students();
    }

    function bindEvents(){
        $("#update-layout-button").click(function(){
            var group_size = parseInt($("#group-size").val(), 10);
            var i;
            for (i=0; i<group_size; i++)
                add_block_to_classroom_layout();
            enable_save_button();
            console.log(group_size);
        });

        $("#reset-layout-button").click(function(){
            reset_classroom_layout();
        });

        $("#save-layout-button").click(function(){
            save_blocks();
        });
    }

    function get_student_by_id(student_id){
        var index;
        for (index in Layout.students){
            if (Layout.students[index]["id"] == student_id)
                return Layout.students[index];
        }
        return null;
    }

    /* Classroom layout updates */
    function add_block(){
        var num_blocks = $("#classroom-layout .block").length;
        var $new_block = BlockLayout.create_block("", "block" + (num_blocks + 1));
        $("#classroom-layout").append($new_block);
        $new_block.draggable({
            containment: "#classroom-layout",
            start: function(){
                enable_save_button();
            }
        });
        $new_block.css("left", (Math.random()*75 + 10) + "%");
        $new_block.css("top", (Math.random()*75 + 10) + "%");
    }

    function remove_block(){

    }

    // function add_student(student_id){
    //     var $student = $("#classroom-layout .student[data-id='" + student_id + "']");
    //     // see if the student is already in the layout
    //     if ($student.length !== 0)
    //         return;
    //     var $new_student = StudentLayout.create_student(student_id);
    //     $("#classroom-layout").append($new_student);
    //     $new_student.draggable({
    //         containment: "#classroom-layout",
    //         start: function(){
    //             $(this).css("z-index", $(this).css("z-index") + 1);
    //         },
    //         stop: function(){
    //             $(this).css("z-index", $(this).css("z-index") - 1);
    //             check_overlap(student_id);
    //             var location = format_position($(this).position().left, $(this).position.top);
    //             StudentLayout.save_student(student_id, location);
    //         }
    //     });
    //     $new_student.css("left", (Math.random()*75 + 10) + "%");
    //     $new_student.css("top", (Math.random()*75 + 10) + "%");
    //     check_overlap(student_id);
    // }

    // function remove_student(student_id){
    //     var $student = $("#classroom-layout .student[data-id='" + student_id + "']");
    //     if ($student.length === 0)
    //         return;
    //     $student.remove();
    // }

    function enable_save_button(){
        $("#save-layout-button").removeAttr("disabled").text("save layout");
    }

    function disable_save_button(){
        $("#save-layout-button").attr("disabled", "disabled").text("saved");
    }

    function reset_classroom_layout(){
        $("#classroom-layout .block").remove();
        enable_save_button();
    }

    function load_blocks(readonly){
        var index;
        for (index in Layout.blocks){
            var $new_block = BlockLayout.create_block(Layout.blocks[index]["id"], Layout.blocks[index]["name"]);
            $("#classroom-layout").append($new_block);
            if (!readonly)
                $new_block.draggable({containment: "#classroom-layout"});
            $new_block.css("left", BlockLayout.get_left(Layout.blocks[index]) + "px");
            $new_block.css("top", BlockLayout.get_top(Layout.blocks[index]) + "px");
        }
    }

    function save_blocks(){
        var data = [];
        $("#classroom-layout .block").each(function(){
            var result = {
                "session": Layout.session_id,
                "id": $(this).attr("data-id"),
                "name": $(this).text(),
                "left": $(this).position().left,
                "top": $(this).position().top
            };
            data.push(result);
        });
        console.log(data);
        var csrftoken = getCookie('csrftoken');
        $.ajaxSetup({
            crossDomain: false, // obviates need for sameOrigin test
            beforeSend: function(xhr, settings) {
                if (!csrfSafeMethod(settings.type)) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });

        $.post("/ajax/layout/blocks/update", {"data": JSON.stringify(data)}, function(data){
            disable_save_button();
        });
    }

    function student_stop_handler(){
        var student_id = $(this).attr("data-id");
        $(this).css("z-index", $(this).css("z-index") - 1);
        check_overlap(student_id);
        var location = format_position($(this).position().left, $(this).position().top);
        $(document).trigger("save_student", [student_id, {"location": location}]);
    }

    function student_start_handler(){
        $(this).css("z-index", $(this).css("z-index") + 1);
    }

    function load_students(){
        var index;
        var $new_student;
        var student_id;
        for (index in Layout.students){
            student_id = Layout.students[index]["id"];
            $new_student = StudentLayout.create_student(student_id, Layout.students[index]["name"]);
            $("#classroom-layout").append($new_student);
            $new_student.draggable({
                containment: "#classroom-layout",
                start: student_start_handler,
                stop: student_stop_handler
            });
            $new_student.css("left", StudentLayout.get_left(Layout.students[index]) + "px");
            $new_student.css("top", StudentLayout.get_top(Layout.students[index]) + "px");
            check_overlap(student_id);
        }
    }

    function save_students(){
        var data = [];
        $("#classroom-layout .student").each(function(){
            var result = {
                "session": Layout.session_id,
                "id": $(this).attr("data-id"),
                "name": $(this).text(),
                "left": $(this).position().left,
                "top": $(this).position().top
            };
            data.push(result);
        });
        console.log(data);
        var csrftoken = getCookie('csrftoken');
        $.ajaxSetup({
            crossDomain: false, // obviates need for sameOrigin test
            beforeSend: function(xhr, settings) {
                if (!csrfSafeMethod(settings.type)) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });

        $.post("/ajax/layout/students/update", {"data": JSON.stringify(data)}, function(data){
            disable_save_button();
        });
    }

    // for this student, see if the current position overlaps any position of group blocks
    function check_overlap(student_id){
        var is_overlapping = false;
        var $student = $(".student[data-id='" + student_id + "']");
        if ($student.length === 0)
            return;
        var r1 = {
            left: $student.position().left,
            top: $student.position().top,
            right: $student.position().left + $student.width(),
            bottom: $student.position().top + $student.height()
        };
        var r2 = {};
        $("#classroom-layout .block").each(function(){
            r2 = {
                left: $(this).position().left,
                top: $(this).position().top,
                right: $(this).position().left + $(this).width(),
                bottom: $(this).position().top + $(this).height()
            };
            // TODO: multiple group case? 
            if (are_rectangles_overlapping(r1, r2)){
                console.log(student_id, $(this).attr("data-name"));
                $(document).trigger("student_status_update", [student_id, {"type": "add_group", "value": $(this).attr("data-name") }]);
                // StudentLayout.add_group(student_id, $(this).attr("data-name"));
            } else {
                if (StudentLayout.has_group(student_id, $(this).attr("data-name")))
                    $(document).trigger("student_status_update", [student_id, {"type": "remove_group", "value": $(this).attr("data-name") }]);
                    // StudentLayout.remove_group(student_id, $(this).attr("data-name"));
            }
        });
    }

    return {
        init: init,
        course_id: course_id,
        session_id: session_id,
        get_student_by_id: get_student_by_id
    };
}();





