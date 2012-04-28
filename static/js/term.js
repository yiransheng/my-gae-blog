(function(){
var play = {

    run: function(){
	var func, args, opts, n;
	try {
	    n = arguments.length;
            func = arguments[0];
	    opts = arguments[n-1];
	    args = n > 2 ? Array.prototype.slice.apply(arguments, [1, n-1]) : undefined;

	    if (!(this[func] instanceof Function)) {
		args = [func].concat(args);
		return this.ai.apply(this, args);
	    }
	    if (this.readOpts(opts, "h")){
	        return (this.help(func))
	    }

	    return String(this[func].apply(this, args)) 
	} catch (err) {
	    return "Unknown command"
	}
    }, 

    readOpts : function(opts, str){
        return (opts.opts.indexOf(str) > -1)  	       
    },

    help: function(f){
	if (typeof f == "undefined"){
	    ret = "[Avaiable Commands] yiran, recent, clear. Type <command> -h for help.";
	    return ret
	}
        return (this.HELP[f]) 
    }, 

    HELP: {
        recent: 'Usage: recent <type>, type: "blog", "experiment", "research"', 
	clear: "Useage: clear"
    }, 

    clear: function() {
	if ($("#output").find("p").length){
           $("#output").empty();	   
	}
    }, 

    alert: function(x){
        alert(x);
	return x
    }, 

    recent: function(_type) {
        if (this.Recent) {
	    if (typeof _type !== "undefined"){
		if (this.Recent[_type]){
	            $(this.Recent[_type]).appendTo("#output");
	            return "==========>"+_type 
		} else {
		    this.Recent[_type] = "";
		    if (this[_type] instanceof Function) this[_type]();
	            return "==========>"+_type 
		}
	    } else {
	        $(this.Recent.all).appendTo("#output");
	        return "==========" 
	    }

	}    	  
	this.Recent = {all:""};
	this.blog();
	this.experiment();
    }, 

    experiment: function(quite) {
	$.ajax("http://yiransheng.github.com/html5lab/index_jsonp.json", 
		{ success : _jsonp,  
	          crossDomain:true, 
	          dataType: "jsonp"});
    }, 

    blog: function(quite) {
	$.ajax("/recent", { success: function(res){
	    var x=0, p, o=$("<div><p>Recent Blog Posts</p></div>");
            for (i in res.recent){
		item = res.recent[i];
		x++;
		p = $("<p></p>")
	        $("<a></a>").text("[Post]" + item.title)
	                    .attr("href", "/"+item.slug)
	                    .appendTo(p);
	        o.append(p);
		if (x>4) {break}
	    }	
            play.Recent.blog = o.html();
	    play.Recent.all += o.html();
	    $(o.html()).appendTo("#output");
	}, 
	crossDomain: true,
	dataType: "json"});
    }, 

    yiran : function(){
        return this.msg	    
    },

    hyphen: function(){
	if (!this.Hyphen) {
	    $("#content .text").css({textAlign:"justify"});
	    Hyphenator.run()
	    this.Hyphen = true;
	}
    }, 

    msg : "I just tricked you to type my name, did I?", 

    ai : function(){
        return this.help() 
    }

},

_jsonp = function(x) {
    var res = x, x=0, p, o = $("<div><p>Recent Experiments</p></div>");       
    for (i in res.registered){
	item = res.registered[i]
	p = $("<p></p>")
	$("<a></a>").text("[Lab]"+item.name)
		    .attr("href", "http://yiransheng.github.com/html5lab/#/"+item.place)
		    .appendTo(p);
	o.append(p);
	if (x>4) {break}
    }
    play.Recent.experiment = o.html();
    play.Recent.all += o.html();
    $(o.html()).appendTo("#output");
},

tid = -1, 

cHisotry = [], 

check = /(^[\w_\$]+)\s+(?:((?:\w+\s*)+)|((?:-\w\s*)+))/g;

play.Yiran = play.yiran;
play.Sheng = play.yiran;
play.sheng = play.yiran;

$.fn.setRange = function(start, end) {
    return this.each(function() {
        if (this.setSelectionRange) {
            this.focus();
            this.setSelectionRange(start, end);
        } else if (this.createTextRange) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    });
}, 

$(function(){
    function resize(){
	while ($("#output").height()>=480){
	    $("#output").find("p:first").remove();
	    $("#logo").remove();
	}
	$("#textarea").focus();
    }

    function terminal(e) {
	var pos, txt, $this, $input;
	$this = $(this);
	$input = $("#line");
	txt = $this.val();
	if (e.keyCode == 8) {
	    $input.text(txt);
            return 	
	}
	if (txt.length >76 || (e.keyCode == 13 && e.type=="keyup")) {
	    if (txt) { 
		cHisotry.unshift(txt);
		tid = -1;
		if (cHisotry.length>=20){
		    cHisotry.splice(19,2);
		}
            }
	    txt = execute(txt);
	    if (typeof txt == "string"){
	        $("<p></p>").text(txt).appendTo("#output"); 
	    }
	    $input.empty();
	    $this.val("");
	    $this.trigger("focus");
	    $("#cursor").css({left:"0px"});
	    resize();
	} else if (e.keyCode == 37 && e.type=="keydown") {
            pos = Number($("#cursor").css("left").replace("px", ""));
	    pos = pos - 7;
	    if (pos>=-txt.length*7) {
	        $("#cursor").css({left:pos+"px"})
		$("#cursor").addClass("on");
	    }
	} else if (e.keyCode == 39 && e.type=="keydown") {
            pos = Number($("#cursor").css("left").replace("px", ""));
	    pos = pos + 7;
	    if (pos >= 0){
	        $("#cursor").removeClass("on");
	    }
	    if (pos<7) {
	        $("#cursor").css({left:pos+"px"})
	    }
	} else if (e.keyCode == 38 && e.type=="keydown") {

	    if (tid==-1 && cHisotry[0] != txt && txt) {
		cHisotry.unshift(txt);
		tid ++;
	    }
	    txt = cHisotry[tid+1] ? cHisotry[tid+1] : txt;
	    if (txt) {
		$this.blur();
	        $input.text(txt);
                pos = -txt.length*7;
		$("#cursor").css({left:pos+"px"}).addClass("on");
	        $this.val(txt).setRange(0, 0);
		$this.focus();
		tid = tid < cHisotry.length-1 ? tid+1 : cHisotry.length-1;
	    } 

	} else if (e.keyCode == 40 && e.type=="keydown") {

	    txt = tid > 0 ? cHisotry[tid-1] : txt;
	    if (tid > 0 && txt){
		$this.blur();
	        $input.text(txt);
	        $this.val(txt).setRange(txt.length, txt.length);
		$this.focus();
		tid --;
	    } else {
	        $input.text(txt);
	        tid = tid >-1 ? tid -1 : -1;
	    }
            pos = 0;
	    $("#cursor").css({left:pos+"px"}).removeClass("on");

	} else {
	    if (txt != $input.text()) $input.text(txt);
	}

    }

    function execute(txt){
        
        txt.replace(/^\s+|\s+$/g, '')
	var match, command, args, opts, ret;

	match = check.exec(txt);

	if (!match || !match[1]) {
	    txt = txt.replace(/\s+/, "");
	    try {
	        ret = play[txt]()
		return ret
	    } catch (err) {
                ret = "Try something else."
	    }
	} else {
	    command = match[1];
	    args = match[2] || " ";
	    opts = match[3] || " "; 
	    opts = opts.replace("-", "");
	    args = args.split(/\s+/);
	    opts = opts.split(/\s+/);
	    try {
	        ret = play.run.apply(play, [command].concat(args, [{opts : opts}]));
		return ret
	    } catch(err) {
	        ret = "Unknown Command"
	    }
	}

        try {
	    ret = run_js(txt);
	} catch (err) {
	    ret = play.help();
	}


	return ret
    }

    $("#textarea").val("")
                  .focus()
                  .keydown(terminal)
                  .keypress(terminal)
                  .keyup(terminal);    

    $("#widgets-area").click(function(e){
        $("#textarea").focus();
    });

    play.hyphen();
});

})();

function run_js(txt){
    var Hyphenator;
    return String(eval(txt))
}
