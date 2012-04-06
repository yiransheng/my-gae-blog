// handles all the scripts that loads async, should load after jQuery


var _Loader = function(namespace, callback) {
    return new _Loader.fn.init(namespace, callback);
};

_Loader.fn = _Loader.prototype = {
    
    constructor: _Loader, 

    init: function(namespace, callback) {

        this.namespace = namespace;
        if (callback instanceof Function) {
            this.callback = callback;
        }

        return this
    }, 

    load: function () {
	try{
	    this.callback(eval(this.namespace));
	    if (this.tid) {
		clearTimeout(this.tid);
	    }
	} catch (err) {
	    var load = this.proxy(this.load, this);
	    this.tid = setTimeout(load, 3000);
	}
    }, 

    proxy: function(f, c) {
        var context = c;
	return function() {
	    f.apply(context, arguments);
	}
    }, 

    tid : null
};

_Loader.fn.init.prototype = _Loader.fn;

// functions used for this blog, hyphenation, mathjax and code prettify

var hyphen = function () {
    Hyphenator.config({
        displaytogglebox : true,
        minwordlength : 4
    });
    Hyphenator.run();
};

var math = function() {
    MathJax.Hub.Config({
        tex2jax: {inlineMath: [['$','$']]}
    });
}; 

var code = function() {
    $("pre").addClass("prettyprint");
    prettyPrint()
};

var printView = function() {
    $("#header").toggleClass("hide");
    $("#comment").toggleClass("hide");
    $("#footer").toggleClass("hide");
    $("#printable-view").addClass("on");
};

// jQuery things

$(document).ready(function(){
    $.getJSON("/recent",function(data){
       if (data.success) {
           for (i in data.recent){
               $("<a></a>").html(data.recent[i].title)
	           .attr("href",("/"+data.recent[i].slug) )
	           .appendTo("#recent-list");
	   }
	   $("#recent-list").slideDown();
       } 
    });
    var url_parts = window.location.href.split("#");
    var printable = url_parts[url_parts.length-1];
    if (printable == "printable") {
        $("#header").toggleClass("hide");
        $("#comment").toggleClass("hide");
        $("#footer").toggleClass("hide");
        $("#printable-view").addClass("on");
    }
    $(".postMeta:first").removeClass("limited");
    $(".more-button:first").remove();
    $("#printable-view").click(function(e){
	e.preventDefault();
        $("#header").toggleClass("hide");
        $("#comment").toggleClass("hide");
        $("#footer").toggleClass("hide");
        $(this).toggleClass("on");
    });
    _Loader("Hyphenator", hyphen).load();
    _Loader("prettyPrint", code).load();
});







