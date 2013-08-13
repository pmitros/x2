
function VerticalQueue(runtime, element) {

    var handler_url = runtime.handler_url('activate');
    //var toolbar_handler = runtime.handler_url('toolbar');

    var toolbar_handler = runtime.handler_url('toolbar')

    function on_help(){
        var issue_summary = prompt('Describe your issue:')

        if(issue_summary == null){
            return
        }

//        reqdata = {
//            session_id: 'sep-1-2013',
//            student_id: student_id,
//            description: issue_summary,
//            resource: 2
//        }

        reqdata = {
            request: 'help',
            issue: issue_summary
        }


       // var reqdata = {request: 'help', 'issue':issue_summary}

         $.ajax({type: "POST",
                url: toolbar_handler,
                data: JSON.stringify(reqdata),
                success: function(evt){console.log(evt)}
        });
    }

    function on_complete(){

         $.ajax({type: "POST",
                url: toolbar_handler,
                data: JSON.stringify({request: 'complete'}),
                success: function(evt){console.log(evt); on_thumb_click()}
        });
    }

    function update_active(data) {
        var active_page = $(element).parents('.queue_widget').children('.active_page').first()
        $(active_page).html(data.page_view);
        $(active_page).find('.button_help').click(on_help)
        $(active_page).find('.button_complete').click(on_complete)

        $(element).html(data.thumb_view)
        $('.thumb').removeClass('active_thumb')
        $(element).children(".thumb").addClass('active_thumb')
    }

    function on_thumb_click(){
          $.ajax({type: "POST",
                url: handler_url,
                data: JSON.stringify({}),
                success: update_active});
    }

    $('.thumb', element).live('click', on_thumb_click);

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
