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

function recordPostData(){
    var form, data, obj;
    form = $("form:first");
    if (!form) return false 
    data = form.serializeArray();
    obj = {};
    _.reduce(data, function(memo, y) {obj[y.name]=y.value;}, 0);
    return $.param(obj);
}


$(function() {
    $('textarea').autogrow();
    $("#post_draft").click(function() {
        if ($(this).is(':checked')) {
            $(this).val(1);
        } else {
            $(this).val(0);
        }
    });
    $("#preview").click(function(e){
	e.preventDefault();
        window.post_data = recordPostData();
	var url = $(this).attr("href");
	$.post(document.URL, window.post_data, function(res){
	    if (res.status=="success") {
	        window.open(url, target="_blank");
	    }
	});
    });
    if (window.post_data = recordPostData()) {
        $("#save").click(function() {
            window.post_data = recordPostData()
        });
        window.onbeforeunload = function(e) {
            if (recordPostData() != window.post_data){
                return "You have changes unsaved, leave now?"
            }
        };
    }
});

