// Help Queue

var HelpQueue = function() {

    var queue = [];

    function init(){
        bindEvents();
    }

    function bindEvents(){
        $(document).on("addToHelpQueue", addHandler);
        $(document).on("removeFromHelpQueue", removeHandler);
    }

    // rearrange the queue layout (most recent at the bottom)
    function refresh_queue(){
        var $students = $("#help-queue .student");
        if ($students.length === 0)
            return;
        var i, $student;
        for (i=0; i<HelpQueue.queue.length; i++){
            $student = $("#help-queue .student[data-id='" + HelpQueue.queue[i] + "']");
            if ($student.length === 0)
                continue;
            $student.css("top", i * ($student.height() + 10) + 50)
                .css("left", "10%");
        }
        $("#help-queue-count").text(HelpQueue.queue.length);
    }

    function addHandler(event, student_id){
        var $student = $("#help-queue .student[data-id='" + student_id + "']");
        // see if the student is already in the layout
        if ($student.length !== 0)
            return;
        var $new_student = StudentLayout.create_student(student_id);
        var student_name = $new_student.attr("data-name");
        var help_request = Layout.get_help_request_by_student_id(student_id);
        if (help_request !== null){
            $("<span/>")
                .addClass("time-elapsed label label-default")
                .text(formatDate(help_request["requested_at"]))
                .appendTo($new_student);
        }
        HelpQueue.queue.push(student_id);
        $("#help-queue").append($new_student);
        refresh_queue();
        showAlert(student_name + " added to the help queue.");
    }

    function removeHandler(event, student_id){
        var $student = $("#help-queue .student[data-id='" + student_id + "']");
        if ($student.length === 0)
            return;
        var student_name = $student.attr("data-name");
        var index = HelpQueue.queue.indexOf(student_id);
        if (index !== -1)
            HelpQueue.queue.splice(index, 1);
        $student.remove();
        refresh_queue();
        showAlert(student_name + " removed from the help queue.");
    }

    return {
        init: init,
        queue: queue
    };
}();
