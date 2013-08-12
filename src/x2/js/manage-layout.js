// Classroom Layout 

var Layout = function() {
    var course_id = "";
    var session_id = "";
    var blocks = [];

    function init(course, session, blocks){
        Layout.course_id = course;
        Layout.session_id = session;
        Layout.blocks = blocks;
        bindEvents();
        console.log("Layout initialized", course, session, blocks);
        load_classroom_layout();
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
            save_classroom_layout();
        });

        $(".block").mousemove(function(){
            enable_save_button();
        });
    }

    function create_block(block_id, block_name){
        var $block = $("<div/>")
                        .addClass("block ui-widget-content")
                        .attr("data-id", block_id)
                        .attr("data-name", block_name)
                        .text(block_name);
        // var $name = $("<div/>").addClass("block-name").text(block);
        // $block.append($name);
        return $block;
    }

    /* Classroom layout updates */
    function add_block_to_classroom_layout(){
        var num_blocks = $("#classroom-layout .block").length;
        var $new_block = create_block("", "block" + (num_blocks + 1));
        $("#classroom-layout").append($new_block);
        $new_block.draggable({containment: "#classroom-layout"});
        $new_block.css("left", (Math.random()*75 + 10) + "%");
        $new_block.css("top", (Math.random()*75 + 10) + "%");
    }

    function remove_block_from_classroom_layout(){

    }

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

    function load_classroom_layout(){
        var index;
        var pos_top;
        var pos_left;
        for (index in Layout.blocks){
            var $new_block = create_block(Layout.blocks[index]["id"], Layout.blocks[index]["name"]);
            $("#classroom-layout").append($new_block);
            $new_block.draggable({containment: "#classroom-layout"});
            $new_block.css("left", Layout.blocks[index]["left"]+"px");
            $new_block.css("top", Layout.blocks[index]["top"]+"px");
        }
    }

    function save_classroom_layout(){
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

        $.post("/x2/ajax/layout/update", {"data": JSON.stringify(data)}, function(data){
            disable_save_button();
        });
    }



    return {
        init: init
    };
}();





