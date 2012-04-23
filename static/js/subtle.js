var imga = new Image(), 
    imgb = new Image(), 
    can_bg = document.getElementById("subtle-bg"), 
    can_ol = document.getElementById("subtle-overlay"), 
    can_rd = document.getElementById("subtle-render"), 
    ctx_bg = can_bg.getContext("2d"),
    ctx_ol = can_ol.getContext("2d"),
    ctx_rd = can_rd.getContext("2d"),
    W = 727, 
    H = 630,
    N = W*H*4, 
    imgDataA, 
    imgDataB,
    imgDataR,
    prep,
    tid,
    aLoaded=false,
    j, i, c=0,imgId = -1,   
    render, 
    nextImg, 
    media_url = "/static/imgs/", 
    imgs = ["cave.jpg", "butterflyn.jpg", "14.jpg","20.jpg","17.jpg"];


imgb.src = media_url+"overlay.jpg";

nextImg = function(load){
    if (!load) {
        imgId ++;
        if (imgId>=imgs.length) imgId =0;
        imga = new Image();
        imga.src = media_url+imgs[imgId];
	aLoaded=false;
    }
    if (aLoaded) {
        prep(); 
    } else {
        imga.onload = function(){
	    aLoaded=true;
	    prep();
	}
    }
};

prep = function() {
   var value;
   ctx_ol.drawImage(imgb,0,0); 
   ctx_bg.drawImage(imga,0,0); 
   imgDataA = ctx_bg.getImageData(0,0,W,H);
   imgDataB = ctx_ol.getImageData(0,0,W,H);
   imgDataR = ctx_rd.getImageData(0,0,W,H);
   for (j=0;j<N;j++){
       value = imgDataA.data[j]*imgDataB.data[j]; 
       value = Math.round(Math.sqrt(value));
       imgDataB.data[j] = value;
   }
   tid=window.setInterval("render()", 100);
};



render = function() {
   var w,h,x,y,X,Y,xx,yy,r,orig,end;
   c++;
   if (c==50) {
       nextImg();
   }
   if (c>160) {
       imgDataR = ctx_rd.getImageData(0,0,W,H);
       c = 0;
       nextImg(true);
       clearInterval(tid);
       return 
   }
   X = Math.floor(Math.random()*W)+1;
   Y = Math.floor(Math.random()*H)+1;
   x = Math.floor(Math.random()*X)+1;
   y = Math.floor(Math.random()*Y)+1;
   x = Math.max(x, X-200, 1)
   y = Math.max(y, Y-200, 1)
   x = X>100 ? Math.min(x, X-100) : 1;
   y = Y>100 ? Math.min(y, Y-100) : 1;
   xx = (x+X)/2;
   yy = (y+Y)/2;
   r = Math.sqrt((x-X)*(x-X)+(y-Y)*(y-Y))*5;
   orig = ((y - 1) * (W * 4)) + ((x - 1) * 4);
   end = ((Y - 1) * (W * 4)) + ((X - 1) * 4);
   for (i=orig;i<=end;i++){
       h = Math.floor(i/(4*W));
       w = Math.floor((i-h*4*W)/4)+1;
       if (w<x || w>X) continue;
       y = Math.sqrt((w-xx)*(w-xx)+(h-yy)*(h-yy)); 
       imgDataR.data[i] = Math.round(imgDataB.data[i]*(r-y)/r);
   }
   ctx_rd.putImageData(imgDataR, 0, 0);
};

imgb.onload = function(){
    nextImg();
};
