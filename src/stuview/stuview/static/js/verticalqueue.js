function VerticalQueue(runtime, element) {


    function update_active(content) {
        $(element).parents('.queue_widget').children('.active_page').html(content);
        console.log('activating with', content)
    }

    var handler_url = runtime.handler_url('activate');

    console.log("initializing whoo", handler_url)

    $('.thumb', element).click(function(eventObject) {
        $.ajax({type: "POST",
                url: handler_url,
                data: JSON.stringify({}),
                success: update_active});
    });
};
