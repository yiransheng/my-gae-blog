$.fn.autogrow = function(options) {

    /*
     *      * Auto-growing textareas; technique ripped from Facebook
     */

    this.filter('textarea').each(function() {

	var $this       = $(this),
	minHeight   = $this.height(),
	lineHeight  = $this.css('lineHeight');

	var shadow = $('<div></div>').css({
	    position:   'absolute',
	    top:        -10000,
	    left:       -10000,
	    width:      $(this).width(),
	    fontSize:   $this.css('fontSize'),
	    fontFamily: $this.css('fontFamily'),
	    lineHeight: $this.css('lineHeight'),
	    resize:     'none'
	}).appendTo(document.body);

	var update = function() {

	    var val = this.value.replace(/</g, '&lt;')
	    .replace(/>/g, '&gt;')
	    .replace(/&/g, '&amp;')
	    .replace(/\n/g, '<br/>');

	    shadow.html(val);
	    $(this).css('height', Math.max(shadow.height() + 60, minHeight));
	}

	$(this).change(update).keyup(update).keydown(update);

	update.apply(this);

    });

    return this;

};


function issueSaveAjax(url){
    var data = $('form:first').serializeArray();
    var obj = {}
    _.reduce(data, function(memo, y) {obj[y.name]=y.value;}, 0);
    if (typeof url == "undefined") url = ""
    $.post(url, obj, function(data) {
       setTimeout(issueSaveAjax, 3000);
    });
}

$(function() {
    $('textarea').autogrow();
    $("#preview").click(function(e){
	e.preventDefault();
	var form = $("form:first").clone();
	form.attr("action", $(this).attr("href"));
	form.attr("target", "_blank");
	form.submit();
    });
});

