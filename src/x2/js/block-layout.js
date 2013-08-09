var BlockLayout = function() {
    function create_block(block_id, block_name){
        var $block = $("<div/>")
                        .addClass("block")
                        .attr("data-id", block_id)
                        .attr("data-name", block_name)
                        .text(block_name);
        // var $name = $("<div/>").addClass("block-name").text(block);
        // $block.append($name);
        return $block;
    }

    function get_left(block){
        if ("location" in block)
            return block["location"].split(",")[0];
        return 0;
    }

    function get_top(block){
        if ("location" in block)
            return block["location"].split(",")[1];
        return 0;
    }

    return {
        create_block: create_block,
        get_left: get_left,
        get_top: get_top
    };
}();
