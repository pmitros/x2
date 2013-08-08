
function VerticalQueue(runtime, element) {

    var handler_url = runtime.handler_url('activate');

     function update_active(data) {
        $(element).parents('.queue_widget').children('.active_page').html(data.page_view);
        $(element).html(data.thumb_view)


        $('.thumb').removeClass('active_thumb')
        $(element).children(".thumb").addClass('active_thumb')
    }


    $('.thumb', element).live('click', function(eventObject) {

        $.ajax({type: "POST",
                url: handler_url,
                data: JSON.stringify({}),
                success: update_active});
    });

    $('.thumb', element).live('mouseenter', function(eventObject){

        var tooltip = $('<div class="tooltip">')
        var helplink = $('<a>', {
            text: 'help',
            title: 'HELP',
            href: '#',
            click: function(){alert("Help is on the way!")}
        }).appendTo(tooltip)

        var togglelink = $('<a>', {
            text: '▼',
            title: 'toggle',
            href: '#',
            click: function(e){
                $('.thumb_content', element).toggle()
                $('.thumb_views', element).toggle()
                e.stopPropagation()
            }
        }).appendTo(tooltip)

//        var completelink = $('<a>', {
//            text: 'X',
//            title: 'complete',
//            href: '#',
//            click: function(e){
//
//                var mask = $('<div class="mask">')
//                mask.text(' ')
//
//                mask.css('width', $(this).outerWidth() )
//                mask.css('height', $(this).outerHeight() )
//
//                $(this).parent().append(mask)
//
//                e.stopPropagation()
//            }
//        }).appendTo(tooltip)

        tooltip.css('left', $(this).offset().left)
        tooltip.css('top', $(this).offset().top)
        tooltip.css('width', $(this).width() +10  )

        tooltip.appendTo($(this))
        tooltip.show()
    })

    $('.thumb', element).live('mouseleave', function(eventObject){


        $(this).children(".tooltip").remove()
    })



};
