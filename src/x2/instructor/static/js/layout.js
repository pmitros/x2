// Classroom Layout 

var Layout = function() {
    var course_id = "";
    var session_id = "";
    var instructor_id = "";
    var blocks = [];
    var students = [];
    var session_students = [];
    var help_requests = []; // gets updated inside the polling function, not init.

    function init(course, session, instructor, blocks, students, session_students, readonly){
        Layout.course_id = course;
        Layout.session_id = session;
        Layout.instructor_id = instructor;
        Layout.blocks = blocks;
        Layout.students = students;
        Layout.session_students = session_students;
        bindEvents();
        console.log("Layout initialized", course, session, blocks, students, session_students);
        // load_blocks(readonly);
        // selecting the default option
        $("#view-options li a").first().trigger("click");
        // load_queue();
    }

    function poll_for_progress_updates(){
        var data = {
            "session_id": Layout.session_id,
            "course_id": Layout.course_id
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
        $.ajax({
            url: "/x2/ajax/layout/students/progress",
            type: "POST",
            data: {"data": JSON.stringify(data)},
            success: function(response) {
                var i;
                var name;
                var entry;
                var type;
                var value;
                try{
                    // handle progress updates
                    var results = JSON.parse(response["results"]);
                    for (name in results){
                        console.log(name, results[name]);
                        entry = results[name]["progress"];
                        value = entry["complete"] + "/" + entry["total"];
                        $(document).trigger(
                            "student_status_update",
                            [get_student_id_by_name(name), {"type": "update_progress", "value": value }]
                        );
                    }
                } catch (e) {
                    console.log("student queue info not available.");
                }
                // handle status updates: help requested, etc.
                Layout.help_requests = JSON.parse(response["requests"]);
                for (i in Layout.help_requests){
                    // id, resource, description, session_id, status, student_id
                    entry = Layout.help_requests[i];
                    // console.log(entry);
                    if (entry["status"] == "requested")
                        type = "help_requested";
                    else if (entry["status"] == "resolved")
                        type = "help_resolved";
                    else if (entry["status"] == "in_progress")
                        type = "start_interaction";
                    $(document).trigger(
                        "student_status_update",
                        [entry["student_id"], {"type": type }]
                    );
                }
            },
            // complete: poll_for_progress_updates,
            error: function(jqXHR, textStatus, errorMessage) {
               console.log(jqXHR, textStatus, errorMessage);
            }
        });

        setTimeout(poll_for_progress_updates, 5000); // polling every 5 seconds
    }

    // function poll_for_progress_updates(){
    //     var data = {
    //         "session_id": Layout.session_id,
    //         "course_id": Layout.course_id
    //     };
    //     var csrftoken = getCookie('csrftoken');
    //     $.ajaxSetup({
    //         crossDomain: false, // obviates need for sameOrigin test
    //         beforeSend: function(xhr, settings) {
    //             if (!csrfSafeMethod(settings.type)) {
    //                 xhr.setRequestHeader("X-CSRFToken", csrftoken);
    //             }
    //         }
    //     });
    //     setTimeout(function(){
    //         $.ajax({
    //             url: "/x2/ajax/layout/students/progress",
    //             type: "POST",
    //             data: {"data": JSON.stringify(data)},
    //             success: function(response) {
    //                 var i;
    //                 var name;
    //                 var entry;
    //                 var type;
    //                 var value;
    //                 // handle progress updates
    //                 var results = JSON.parse(response["results"]);
    //                 for (name in results){
    //                     console.log(name, results[name]);
    //                     entry = results[name]["progress"];
    //                     value = entry["complete"] + "/" + entry["total"];
    //                     $(document).trigger(
    //                         "student_status_update",
    //                         [get_student_id_by_name(name), {"type": "update_progress", "value": value }]
    //                     );
    //                 }
    //                 // handle status updates: help requested, etc.
    //                 Layout.help_requests = JSON.parse(response["requests"]);
    //                 for (i in Layout.help_requests){
    //                     // id, resource, description, session_id, status, student_id
    //                     entry = Layout.help_requests[i];
    //                     // console.log(entry);
    //                     if (entry["status"] == "requested")
    //                         type = "help_requested";
    //                     else if (entry["status"] == "resolved")
    //                         type = "help_resolved";
    //                     else if (entry["status"] == "in_progress")
    //                         type = "start_interaction";
    //                     $(document).trigger(
    //                         "student_status_update",
    //                         [entry["student_id"], {"type": type }]
    //                     );
    //                 }
    //             },
    //             complete: poll_for_progress_updates,
    //             error: function(jqXHR, textStatus, errorMessage) {
    //                console.log(jqXHR, textStatus, errorMessage);
    //             }
    //         });
    //     }, 5000); // polling every 5 seconds
    // }

    function bindEvents(){
        $("#update-layout-button").click(function(){
            var group_size = parseInt($("#group-size").val(), 10);
            var i;
            for (i=0; i<group_size; i++)
                add_block_to_classroom_layout();
            enable_save_button();
        });

        $("#reset-layout-button").click(function(){
            reset_classroom_layout();
        });

        $("#save-layout-button").click(function(){
            save_blocks();
        });

        $("#view-options li a").click(function(){
            console.log($(this).attr("id"), "selected");
            $("#classroom-layout").html("");
            $("#view-options li").removeClass("active");
            $(this).parent().addClass("active");
            if ($(this).attr("id") == "classroom-view-button"){
                load_classroom_view();
            } else if ($(this).attr("id") == "list-view-button"){
                load_list_view();
            }
        });
    }


    function load_classroom_view(){
        load_students();
    }

    function load_list_view(){
        load_students_list();
    }

    function get_student_by_id(student_id){
        var index;
        for (index in Layout.students){
            if (Layout.students[index]["id"] == student_id)
                return Layout.students[index];
        }
        return null;
    }

    function get_student_id_by_name(student_name){
        var index;
        for (index in Layout.students){
            if (Layout.students[index]["name"] == student_name)
                return Layout.students[index]["id"];
        }
        return null;
    }

    function get_session_student_by_student_id(student_id){
        var index;
        for (index in Layout.session_students){
            if (Layout.session_students[index]["student_id"] == student_id)
                return Layout.session_students[index];
        }
        return null;
    }

    function get_help_request_by_student_id(student_id){
        var index;
        for (index in Layout.help_requests){
            if (Layout.help_requests[index]["student_id"] == student_id)
                return Layout.help_requests[index];
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
        var csrftoken = getCookie('csrftoken');
        $.ajaxSetup({
            crossDomain: false, // obviates need for sameOrigin test
            beforeSend: function(xhr, settings) {
                if (!csrfSafeMethod(settings.type)) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });

        $.post("/x2/ajax/layout/blocks/update", {"data": JSON.stringify(data)}, function(data){
            disable_save_button();
        });
    }

    function student_stop_handler(event){
        // event.toElement is the element that was responsible
        // for triggering this event. The handle, in case of a draggable.
        $( event.toElement ).one('click', function(e){ e.stopImmediatePropagation(); } );

        var student_id = $(this).attr("data-id");
        $(this).css("z-index", $(this).css("z-index") - 1);
        check_overlap(student_id);
        var location = format_position($(this).position().left, $(this).position().top);
        $(document).trigger("save_student", [student_id, {"location": location}]);
    }

    function student_start_handler(){
        $(this).css("z-index", $(this).css("z-index") + 1);
    }

    function get_group_count(group){
        var count = 0;
        $("#classroom-layout .student").each(function(){
            if ($(this).attr("data-group") == group)
                count += 1;
        });
        return count;
    }

    function group_exists(group){
        var exists = false;
        $("#classroom-layout .student").each(function(){
            if ($(this).attr("data-group") == group)
                exists = true;
        });
        return exists;
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


    function load_students_list(){
        var index;
        var student_id;
        var $new_student;
        var $table = $("<table/>").attr("id","students-list").addClass("sortable table table-striped");
        var $header = $("<tr/>");
        $("<th/>").append("<span/>").text("status")
                .appendTo($header);
        $("<th/>").append("<span/>").text("name")
                .appendTo($header);
        $("<th/>").append("<span/>").text("group")
                .appendTo($header);
        $("<th/>").append("<span/>").text("progress")
                .appendTo($header);
        $("<span/>").addClass("sort-option").attr("data-default", "ascending")
            .appendTo($header.find("th"));
        $table.append($header);
        for (index in Layout.students){
            student_id = Layout.students[index]["id"];
            $new_student = StudentLayout.create_student_list(student_id);
            $table.append($new_student);
        }
        $("#classroom-layout").append($table);
        bindSortableTableEvents();
        $("#students-list th").first().click().click();
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
        var csrftoken = getCookie('csrftoken');
        $.ajaxSetup({
            crossDomain: false, // obviates need for sameOrigin test
            beforeSend: function(xhr, settings) {
                if (!csrfSafeMethod(settings.type)) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });

        $.post("/x2/ajax/layout/students/update", {"data": JSON.stringify(data)}, function(data){
            disable_save_button();
        });
    }

    // for this student, see if the current position overlaps any position of group blocks
    function check_overlap_group(student_id){
        var is_overlapping = false;
        var $student = $("#classroom-layout .student[data-id='" + student_id + "']");
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

    // for this student, see if the current position overlaps with other students
    function check_overlap(student_id){
        var is_overlapping = false;
        var $student = $("#classroom-layout .student[data-id='" + student_id + "']");
        if ($student.length === 0)
            return;
        var r1 = {
            left: $student.position().left,
            top: $student.position().top,
            right: $student.position().left + $student.width(),
            bottom: $student.position().top + $student.height()
        };
        var r2 = {};
        var dirty = false;
        $("#classroom-layout .student").each(function(){
            // avoid checking against self
            if ($(this).attr("data-id") == student_id)
                return;
            r2 = {
                left: $(this).position().left,
                top: $(this).position().top,
                right: $(this).position().left + $(this).width(),
                bottom: $(this).position().top + $(this).height()
            };
            if (are_rectangles_overlapping(r1, r2)){
                // same group name
                if (StudentLayout.has_group(student_id, $(this).attr("data-group"))){
                    // both are singletons -> create a new group
                    if ($(this).attr("data-group") === ""){
                        var new_group = "group" + uid();
                        while(group_exists(new_group))
                            new_group = "group" + uid();
                        $(document).trigger("student_status_update", [student_id, {"type": "add_group", "value": new_group }]);
                        $(document).trigger("student_status_update", [$(this).attr("data-id"), {"type": "add_group", "value": new_group }]);
                        dirty = true;
                    }
                    // already in the same group, so pass except for initialization
                    else {
                        $(document).trigger("student_status_update", [student_id, {"type": "add_group", "value": $(this).attr("data-group") }]);
                        $(document).trigger("student_status_update", [$(this).attr("data-id"), {"type": "add_group", "value": $(this).attr("data-group") }]);
                        dirty = true;
                    }
                // different group name
                } else {
                    // if checked student has no group
                    if ($(this).attr("data-group") === ""){
                        $(document).trigger("student_status_update", [$(this).attr("data-id"), {"type": "add_group", "value": $student.attr("data-group") }]);
                        dirty = true;
                    }
                    // if dropped student has no group
                    else if ($student.attr("data-group") === ""){
                        $(document).trigger("student_status_update", [student_id, {"type": "add_group", "value": $(this).attr("data-group") }]);
                        dirty = true;
                    }
                    // update student's group info
                    else {
                        $(document).trigger("student_status_update", [student_id, {"type": "add_group", "value": $(this).attr("data-group") }]);
                        dirty = true;
                    }
                }
            } else {
                // if previously in the same group, break them
                if (!dirty && StudentLayout.has_group(student_id, $(this).attr("data-group")) && $student.attr("data-group") !== ""){
                    // two-student groups becoming singletons -> remove the group altogether and update group to None
                    if (get_group_count($(this).attr("data-group")) == 2) {
                        $(document).trigger("student_status_update", [$(this).attr("data-id"), {"type": "remove_group", "value": $(this).attr("data-group") }]);
                    }
                    $(document).trigger("student_status_update", [student_id, {"type": "remove_group", "value": $(this).attr("data-group") }]);
                }
            }
        });
    }

    // function load_queue(){
    //     $("#classroom-layout .student").each(function(){
    //         if ($(this).find(".student-badge[class*='badge-']").length){
    //             $(document).trigger("addToHelpQueue", [$(this).attr("data-id")]);
    //         }
    //     });
    // }

    return {
        init: init,
        course_id: course_id,
        session_id: session_id,
        instructor_id: instructor_id,
        get_student_by_id: get_student_by_id,
        get_session_student_by_student_id: get_session_student_by_student_id,
        get_help_request_by_student_id: get_help_request_by_student_id,
        poll_for_progress_updates: poll_for_progress_updates
    };
}();





