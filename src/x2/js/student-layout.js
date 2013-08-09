
var StudentLayout = function() {

    function init(){
        bindEvents();
    }

    function bindEvents(){
        $(document).on("save_student", save_student_handler);
        $(document).on("student_status_update", status_update_handler);
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
        if (student === null){
        // if new student, load with default information
            $student = $("<div/>")
                            .addClass("student")
                            .attr("data-id", student_id)
                            .attr("data-name", student_name);
            $profile_img = $("<img/>").attr("src", "http://placehold.it/80x80");
            $profile = $("<div/>").addClass("student-profile").append($profile_img);
            $badge = $("<div/>").addClass("student-badge");
            $progress = $("<div/>").addClass("student-progress").text("3/5");
            $group = $("<div/>").addClass("student-group").text("None");
            $name = $("<div/>").addClass("student-name").text(student_name);

        } else {
        // if the id already exists, load with information  
            $student = $("<div/>")
                            .addClass("student")
                            .attr("data-id", student_id)
                            .attr("data-name", student["name"]);
            $profile_img = $("<img/>").attr("src", "http://placehold.it/80x80");
            $profile = $("<div/>").addClass("student-profile").append($profile_img);
            $badge = $("<div/>").addClass("student-badge");
            // TODO: sync
            $progress = $("<div/>").addClass("student-progress").text("3/5");
            $group = $("<div/>").addClass("student-group").text("None");
            $name = $("<div/>").addClass("student-name").text(student["name"]);
        }
        $student.append($profile).append($badge).append($progress).append($group).append($name);
        return $student;
    }

    function display_group(student_id){

    }

    function display_progress(student_id){

    }

    function display_name(student_id){

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
        return ($student.find(".student-group").text() == group);
    }

    function add_group(student_id, group){
        var $student = $(".student[data-id='" + student_id + "']");
        if ($student.length === 0)
            return;
        $student.addClass("group").find(".student-group")
            .text(group);

    }

    function remove_group(student_id, group){
        var $student = $(".student[data-id='" + student_id + "']");
        if ($student.length === 0)
            return;
        $student.removeClass("group").find(".student-group")
            .text("None");
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

        $.post("/ajax/layout/student/update", {"data": JSON.stringify(data)}, function(data){
            console.log(data);
        });
    }

    function status_update_handler(event, student_id, status){
        var data = {
            "session_id": Layout.session_id,
            "student_id": student_id
        };
        console.log("status update", student_id, status);
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

        $.post("/ajax/layout/session-student/update", {"data": JSON.stringify(data)}, function(data){
            console.log(data);
        });
    }

    return {
        init: init,
        create_student: create_student,
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
