
var StudentLayout = function() {

    function init(){
        bindEvents();
    }

    function bindEvents(){
        $(document).on("save_student", save_student_handler);
        $(document).on("student_status_update", status_update_handler);
        $(document).on("click", ".start-help-button", start_help_handler);
        $(document).on("click", ".end-help-button", end_help_handler);
        $(document).on("click", ".student-remove-button", student_remove_handler);
        // dismiss any open popover when clicked elsewhere on the screen
        $('body').on('click', function (e) {
            $('.student, .student-list').each(function () {
                //the 'is' for buttons that trigger popups
                //the 'has' for icons within a button that triggers a popup
                if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
                    $(this).popover('hide');
                }
            });
        });
        // to locate the popover at the bottom of the current mouse position
        $(document).on("click", ".student-list", function(event){
            $popover = $(".popover");
            console.log(event.pageX, event.pageY, $popover.width(), $popover.height());
            $popover.css('left', (event.pageX - $popover.width()/2) + 'px');
            $popover.css('top', (event.pageY + 10) + 'px');
        });
    }

    function start_help_handler(event){
        var student_id = $(event.target).parent().attr("data-id");
        console.log($(event.target), student_id);
        window.location = "./capture?sid=" + student_id;
    }

    function end_help_handler(event){
        console.log(event);
        // var student_id = event
    }

    function student_remove_handler(event){
        console.log(event);
        // var student_id = event
    }

    function create_student(student_id){
        var $student;
        var $profile_img;
        var $profile;
        var $badge;
        var $progress;
        var $group;
        var $name;

        var student = Layout.get_student_by_id(student_id);
        var session_student = Layout.get_session_student_by_id(student_id);
        if (student === null){
        // if new student, load with default information
            $student = $("<div/>")
                            .addClass("student")
                            .attr("data-id", student_id)
                            .attr("data-name", "anonymous")
                            .attr("data-group", "");
            $profile_img = $("<img/>").attr("src", "http://placehold.it/80x80");
            $profile = $("<div/>").addClass("student-profile").append($profile_img);
            $badge = $("<div/>").addClass("student-badge");
            $progress = $("<div/>").addClass("student-progress").text("3/5");
            $group = $("<div/>").addClass("student-group").text("None");
            $name = $("<div/>").addClass("student-name").text("anonymous");

        } else {
        // if the id already exists, load with information  
            $student = $("<div/>")
                            .addClass("student")
                            .attr("data-id", student_id)
                            .attr("data-name", student["name"])
                            .attr("data-group", session_student["group"]);
            $profile_img = $("<img/>").attr("src", "http://placehold.it/80x80");
            $profile = $("<div/>").addClass("student-profile").append($profile_img);
            $badge = $("<div/>").addClass("student-badge");
            // TODO: remove duplicate code: use add_badge, add_group, etc.
            if (session_student["badge"] !== "")
                $badge.addClass("badge-" + session_student["badge"])
                    .html("<i class='icon-large icon-" + session_student["badge"] + "'></i>");
            $progress = $("<div/>").addClass("student-progress").text(display_progress(session_student["progress"]));
            $group = $("<div/>").addClass("student-group").text(display_group(session_student["group"]));
            $name = $("<div/>").addClass("student-name").text(display_name(student["name"]));
        }
        $student.append($profile).append($badge).append($progress).append($group).append($name);
        add_popover($student);
        return $student;
    }

    function create_student_list(student_id){
        var student = Layout.get_student_by_id(student_id);
        var session_student = Layout.get_session_student_by_id(student_id);
        var $student = $("<tr/>")
                            .addClass("student-list")
                            .attr("data-id", student_id)
                            .attr("data-name", student["name"])
                            .attr("data-group", session_student["group"]);
        $("<td/>").text(session_student["badge"]).appendTo($student);
        $("<td/>").text(student["name"]).appendTo($student);
        $("<td/>").text(session_student["group"]).appendTo($student);
        $("<td/>").text(session_student["progress"]).appendTo($student);
        add_popover($student);
        return $student;
    }

    function add_popover($student){
        var student_id = $student.attr("data-id");
        var student = Layout.get_student_by_id(student_id);
        var html = "<div data-id='" + student_id + "'>" +
            "<div>&quot;I don't understand how to derive x from the equation.&quot;</div><br/>" +
            "<button class='btn btn-primary start-help-button'>Help this student</button><br/>" +
            "<button type='button' class='btn btn-primary end-help-button'>Mark as resolved</button><br/>" +
            // + "<button type='button' class='btn btn-danger remove-student-button'>Remove this student</button>"
            "</div>";
        $student.popover({
            "html": true,
            "content": html,
            "container": 'body',
            "placement": 'bottom',
            "title": student["name"]
        });
    }


    function display_group(group){
        return group === "" ? "None" : group;
    }

    function display_progress(progress){
        return progress === "" ? "3/5" : progress;

    }

    function display_name(name){
        return name === "" ? "anonymous" : name;
    }

    /* Student profile */
    // badge_type = {"question", "comment"}

    function has_badge(student_id, badge_type){
        var $student = $(".student[data-id='" + student_id + "']");
        if ($student.length === 0)
            return false;
        return ($student.find(".student-badge").hasClass("badge-" + badge_type));
    }

    function add_badge(student_id, badge_type){
        var $student = $(".student[data-id='" + student_id + "']");
        if ($student.length === 0)
            return;
        $student.find(".student-badge")
            .addClass("badge-" + badge_type)
            .html("<i class='icon-large icon-" + badge_type + "'></i>");
    }

    function remove_badge(student_id, badge_type){
        var $student = $(".student[data-id='" + student_id + "']");
        if ($student.length === 0)
            return;
        $student.find(".student-badge")
            .removeClass("badge-" + badge_type)
            .text("");
    }

    function update_progress(student_id, progress){
        var $student = $(".student[data-id='" + student_id + "']");
        if ($student.length === 0)
            return;
        $student.find(".student-progress")
            .text(progress);
    }


    function has_group(student_id, group){
        var $student = $(".student[data-id='" + student_id + "']");
        if ($student.length === 0)
            return false;
        return ($student.attr("data-group") == group);
    }

    function add_group(student_id, group){
        var $student = $(".student[data-id='" + student_id + "']");
        if ($student.length === 0)
            return;
        $student.addClass("group").attr("data-group", group)
            .find(".student-group").text(group);
    }

    function remove_group(student_id, group){
        var $student = $(".student[data-id='" + student_id + "']");
        if ($student.length === 0)
            return;
        $student.removeClass("group").attr("data-group", "")
            .find(".student-group").text("None");
    }

    function get_left(student){
        if ("location" in student)
            return student["location"].split(",")[0];
        return 0;
    }

    function get_top(student){
        if ("location" in student)
            return student["location"].split(",")[1];
        return 0;
    }

    function save_student_handler(event, student_id, prop_list){
        var key;
        var data = {
            "id": student_id
        };
        for (key in prop_list){
            data[key] = prop_list[key];
        }
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

        $.post("/x2/ajax/layout/student/update", {"data": JSON.stringify(data)}, function(data){
            console.log(data);
        });
    }

    function status_update_handler(event, student_id, status){
        var data = {
            "session_id": Layout.session_id,
            "student_id": student_id
        };
        // expection: status => {"type": type, "value": value}
        if (typeof status["type"] === "undefined")
            return;
        if (status["type"] === "need_help"){
            $(document).trigger("addToHelpQueue", [student_id]);
            add_badge(student_id, "question");
            data["badge"] = "question";
        } else if (status["type"] === "help_resolved"){
            $(document).trigger("removeFromHelpQueue", [student_id]);
            remove_badge(student_id, "question");
            data["badge"] = "";
        } else if (status["type"] === "start_interaction"){
            add_badge(student_id, "comment");
            data["badge"] = "comment";
        } else if (status["type"] === "end_interaction"){
            remove_badge(student_id, "comment");
            data["badge"] = "";
        } else if (status["type"] === "update_progress"){
            update_progress(student_id, status["value"]);
            data["progress"] = status["value"];
        } else if (status["type"] == "add_group"){
            add_group(student_id, status["value"]);
            data["group"] = status["value"];
        } else if (status["type"] == "remove_group"){
            remove_group(student_id, status["value"]);
            data["group"] = "";
        }

        var csrftoken = getCookie('csrftoken');
        $.ajaxSetup({
            crossDomain: false, // obviates need for sameOrigin test
            beforeSend: function(xhr, settings) {
                if (!csrfSafeMethod(settings.type)) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });

        $.post("/x2/ajax/layout/session-student/update", {"data": JSON.stringify(data)}, function(data){
            console.log(data);
        });
    }

    return {
        init: init,
        create_student: create_student,
        create_student_list: create_student_list,
        has_badge: has_badge,
        add_badge: add_badge,
        remove_badge: remove_badge,
        update_progress: update_progress,
        has_group: has_group,
        add_group: add_group,
        remove_group: remove_group,
        get_left: get_left,
        get_top: get_top
    };
}();
