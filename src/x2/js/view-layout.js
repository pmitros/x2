
function create_student(student){
    var $student = $("<div/>")
                    .addClass("student ui-widget-content")
                    .attr("data-id", student);
    var $profile_img = $("<img/>").attr("src", "http://ls.edx.org:3333/static/img/profile.png");
    var $profile = $("<div/>").addClass("student-profile").append($profile_img);
    var $badge = $("<div/>").addClass("student-badge");
    var $progress = $("<div/>").addClass("student-progress").text("3/5");
    var $group = $("<div/>").addClass("student-group").text("group");
    var $name = $("<div/>").addClass("student-name").text(student);
    $student.append($profile).append($badge).append($progress).append($group).append($name);
    return $student;
}

var help_queue = [];

// rearrange the queue layout (most recent at the bottom)
function refresh_queue(){
    var $students = $("#help-queue .student");
    if ($students.length === 0)
        return;
    var i, $student;
    for (i=0; i<help_queue.length; i++){
        $student = $("#help-queue .student[data-id='" + help_queue[i] + "']");
        if ($student.length === 0)
            continue;
        $student.css("top", i * ($student.height() + 20) + 60)
            .css("left", "25%");
    }
}

function add_to_help_queue(student){
    var $student = $("#help-queue .student[data-id='" + student + "']");
    // see if the student is already in the layout
    if ($student.length !== 0)
        return;
    var $new_student = create_student(student);
    help_queue.push(student);
    $("#help-queue").append($new_student);
    refresh_queue();
}

function remove_from_help_queue(student){
    var $student = $("#help-queue .student[data-id='" + student + "']");
    if ($student.length === 0)
        return;
    var index = help_queue.indexOf(student);
    if (index !== -1)
        help_queue.splice(index, 1);
    $student.remove();
    refresh_queue();
}

function add_to_classroom_layout(student){
    var $student = $("#classroom-layout .student[data-id='" + student + "']");
    // see if the student is already in the layout
    if ($student.length !== 0)
        return;
    var $new_student = create_student(student);
    $("#classroom-layout").append($new_student);
    $new_student.draggable({containment: "#classroom-layout"});
    $new_student.css("left", (Math.random()*75 + 10) + "%");
    $new_student.css("top", (Math.random()*75 + 10) + "%");
}

function remove_from_classroom_layout(student){
    var $student = $("#classroom-layout .student[data-id='" + student + "']");
    if ($student.length === 0)
        return;
    $student.remove();
}


/* Student profile */
// badge_type = {"question", "comment"}
function add_badge(student, badge_type){
    var $student = $(".student[data-id='" + student + "']");
    if ($student.length === 0)
        return;
    $student.find(".student-badge")
        .addClass("badge-" + badge_type)
        .html("<i class='icon-large icon-" + badge_type + "'></i>");
}

function remove_badge(student, badge_type){
    var $student = $(".student[data-id='" + student + "']");
    if ($student.length === 0)
        return;
    $student.find(".student-badge")
        .removeClass("badge-" + badge_type)
        .html("");
}

function update_progress(student, progress){
    var $student = $(".student[data-id='" + student + "']");
    if ($student.length === 0)
        return;
    $student.find(".student-progress")
        .html(progress);
}

function add_group(student, group){
    var $student = $(".student[data-id='" + student + "']");
    if ($student.length === 0)
        return;
    $student.find(".student-group")
        .html(group);

}

function remove_group(student, group){
    var $student = $(".student[data-id='" + student + "']");
    if ($student.length === 0)
        return;
    $student.find(".student-group")
        .html("None");
}
