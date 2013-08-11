
function Toolbar(runtime, element) {

    var handler_url = runtime.handler_url('toolbar');


    function on_help(event){
        console.log("help")
    }

    function on_complete(event){
        console.log("complete")
    }

    $('.button_help', element).click(on_help)
    $('.button_complete', element).click(on_complete)
};
