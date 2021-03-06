

function getInternetExplorerVersion()
// Returns the version of Internet Explorer or a -1
// (indicating the use of another browser).
{
  var rv = -1; // Return value assumes failure.
  if (navigator.appName == 'Microsoft Internet Explorer')
  {
    var ua = navigator.userAgent;
    var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
    if (re.exec(ua) != null)
      rv = parseFloat( RegExp.$1 );
  }
  return rv;
}

function isIE(){
    if (getInternetExplorerVersion() === -1)
        return false;
    return true;
}

function checkVersion()
{
  var msg = "You're not using Internet Explorer.";
  var ver = getInternetExplorerVersion();

  if ( ver > -1 )
  {
    if ( ver >= 8.0 ) 
      msg = "You're using a recent copy of Internet Explorer."
    else
      msg = "You should upgrade your copy of Internet Explorer.";
  }
  alert( msg );
}



function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

function are_rectangles_overlapping(r1, r2) {
  return !(r2.left > r1.right ||
           r2.right < r1.left ||
           r2.top > r1.bottom ||
           r2.bottom < r1.top);
}

function format_position(left, top){
    return left + "," + top;
}

function hasGetUserMedia() {
  // Note: Opera is unprefixed.
  return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

// create a unique integer for the current view
var uid = (function(){var id=0;return function(){if(arguments[0]===0)id=0;return id++;}})();

/* Check if the string is a number */
function isNumber(n){
    return !isNaN(parseFloat(n)) && isFinite(n);
}

/* Sort table by the table ID and column index. */
function sortTable(id, index, is_first_header, is_ascending){
    var tbl = document.getElementById(id).tBodies[0];
    var store = [];
    var i = is_first_header ? 1 : 0;
    var len;
    for(len = tbl.rows.length; i < len; i++){
        var row = tbl.rows[i];
        var sortnr = row.cells[index].textContent || row.cells[index].innerText;
        store.push([sortnr, row]);
    }
    store.sort(function(x, y){
        var val = 0;
        if (isNumber(x[0]) && isNumber(y[0]))
            return parseFloat(x[0]) - parseFloat(y[0]);
        if (x[0] > y[0])
            val = 1;
        if (x[0] < y[0])
            val = -1;
        if (!is_ascending)
            val *= -1;
        return val;
    });
    i = is_first_header ? 1 : 0;
    for(len = store.length; i < len; i++){
        tbl.appendChild(store[i][1]);
    }
    store = null;
}


function bindSortableTableEvents(){
    $("table.sortable th").click(function(){
        var index = $(this).index();
        var $option = $(this).find(".sort-option");
        var sort_class = "";
        var is_ascending = true;
        var table_id = $(this).closest("table").attr("id");
        // alternate between asc and desc sorting
        if ($option.hasClass("active")) {
            is_ascending = !($option.hasClass("ascending"));
            sort_class = $option.hasClass("ascending") ? "descending" : "ascending";
        } else {
            is_ascending = $option.attr("data-default") == "ascending";
            sort_class = $option.attr("data-default");
        }
        $("#" + table_id + " .sort-option").text("");
        $("#" + table_id + " .sort-option").removeClass("active ascending descending");
        $option.addClass("active " + sort_class);
        if (is_ascending)
            $option.html("&#8593;");
        else
            $option.html("&#8595;");
        sortTable(table_id, index, true, is_ascending);
    });

    $("table.sortable th").mouseenter(function(){
        var $option = $(this).find(".sort-option");
        var is_ascending = true;
        // alternate between asc and desc sorting
        if ($option.hasClass("active")) {
            is_ascending = !($option.hasClass("ascending"));
        } else {
            is_ascending = $option.attr("data-default") == "ascending";
        }
        if (is_ascending)
            $option.html("&#8593;");
        else
            $option.html("&#8595;");
    });

    $("table.sortable th").mouseleave(function(){
        var $option = $(this).find(".sort-option");
        var is_ascending = true;
        // alternate between asc and desc sorting
        if ($option.hasClass("active")) {
            // check if preview is on or not
            is_ascending = !($option.hasClass("ascending"));
            if (is_ascending)
                $option.html("&#8595;");
            else
                $option.html("&#8593;");
        } else {
            is_ascending = $option.attr("data-default") == "ascending";
            $option.html("&nbsp;");
        }
    });
}


function formatDate(str) {
    // new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
    // var date = new Date(str.substr(0,4), str.substr(4,2)-1, str.substr(-2)); // months are 0-based
    // var date = new Date(str);
    // return _prettyDate(date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate());
    return _prettyDate(str);
}

function _prettyDate(date_str){
    var time_formats = [
    [60, 'just now', '1'], // 60
    [120, '1 min ago', '1 min from now'], // 60*2
    [3600, 'mins', 60], // 60*60, 60
    [7200, '1 hour ago', '1 hour from now'], // 60*60*2
    [86400, 'hours', 3600], // 60*60*24, 60*60
    [172800, 'yesterday', 'tomorrow'], // 60*60*24*2
    [604800, 'days', 86400], // 60*60*24*7, 60*60*24
    [1209600, 'last week', 'next week'], // 60*60*24*7*4*2
    [2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
    [4838400, 'last month', 'next month'], // 60*60*24*7*4*2
    [29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
    [58060800, 'last year', 'next year'], // 60*60*24*7*4*12*2
    [2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
    [5806080000, 'last century', 'next century'], // 60*60*24*7*4*12*100*2
    [58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
    ];
    var time = ('' + date_str).replace(/-/g,"/").replace(/[TZ]/g," ").replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    if(time.substr(time.length-4,1)==".") time = time.substr(0,time.length-4);
    var seconds = (new Date - new Date(time)) / 1000;
    var token = 'ago', list_choice = 1;
    if (seconds < 0) {
        seconds = Math.abs(seconds);
        token = 'from now';
        list_choice = 2;
    }
    var i = 0, format;
    console.log(time, seconds, format, list_choice);
    while (format = time_formats[i++])
    if (seconds < format[0]) {
      if (typeof format[2] == 'string')
        return format[list_choice];
      else
        return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
    }
    return time;
};

function showAlert(message){
    // var height = $("#alert").height();
    // $("#alert").removeClass("animation").css("height", height).addClass("animation");
    $("#alert").text(message).show();
    setTimeout(function(){
       $("#alert").hide();// or fade, css display however you'd like.
    }, 5000);
}
