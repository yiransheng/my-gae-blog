var IMG = new Image();

IMG.src = $("#logo")[0].src;


$(IMG).bind("load", function() {
      var ctx,canvas,Particle,Sys,W,H,p,sys,tl, 
          redValueForPixle,imageData, 
          pixels, spawn, image = this,x,y,xR,yR,l,
          line,start,end,srcImg = $("#logo")[0]; 

      canvas = $('#stage');
      if (! (canvas[0].getContext && (ctx=canvas[0].getContext("2d"))) ) {
	 canvas.remove();
         return 
      };
      
      W = srcImg.offsetWidth || 200;
      H = srcImg.offsetHeight || 200;
      xR=Sheng.point(W/2,0);
      yR=Sheng.point(0,H/2);

      $("#stage-wrapper").css({
          position: "absolute", 
	  top: "29px", 
	  left: "93px", 
      });
      canvas.css({
	  display: "none",
      });
      
      canvas[0].width = W;
      canvas[0].height = H;

      Particle = Sheng.Particle.extend({
	  line: null, 
	  dest: null
      });
      Sys = Sheng.ParticleSys.extend({
	  diff: 0, 
	  j1: 15, 
	  j2: 85, 
	  on: false,
          outBound: function(p) {
	      var npx = p.p.x + p.v.x;
	      if (npx<-W/2 || npx>W/2) {
		  p.v.x*=-1;
		  return true
	      } 
	      return false
	  }, 

	  updateAll: function() {
              
	      var a,i,j,k,p,mk,d,
	          p1 = this.diff<60 ? Math.random()*W : 0, 
	          p2 = this.diff<60 ? Math.random()*W : 0;
	      this.j1 = this.j1>=this.j2-5 ? Math.min(p1,p2) : this.j1;
	      this.j2 = this.j2<=this.j1+5 ? Math.max(p1,p2,this.j1+15) : this.j2;

	      for (j=0;j<this.particles.length;j++) {
	          p = this.particles[j];
		  p.p.x += p.v.x;
		  d = ( - p.p.x)*(Math.random()*0.05+0.05);
		  p.v.x+=d;
		  p.v.x*=(Math.random()*.1+.9);
		  d = Math.abs(d);
		  this.diff *= 0.9;
		  if (this.diff<=2 && d<0.05) {
		      p.v.x = Math.random()*3-1.5;
		  } else if (d<0.05 && j>this.j1 && j<this.j2) {
                      p.p.x = Math.random()*W*0.75-W*.35;
		      p.v.x = Math.random()*10 - 5;
		      this.j1+=Math.random();
		      this.j2-=Math.random();
		  } else {
		      this.diff+=d*5;
		  }
		  this.diff=this.diff>99 ? 99 : this.diff;
		  i = 4*j*W;
		  for (k=p.beg*4;k<p.end*4;k++){
		      mk = k - Math.round(p.p.x)*4;
		      if (mk>=0 && mk <W*4) {
		          this.imageData.data[i+k]=p.line[mk]*(1-d/3);
		      } else {
		          this.imageData.data[i+k]=180;
		      }
		  }
	      }
	      ctx.putImageData(this.imageData, 0, 0);  
	  }
      });

      sys = Sheng.create(Sys);
      sys.init({silent:true, maxsize:W*H});
      tl = Sheng.timeline(20);

      tl.bind(tl.EVENT_ENTER_FRAME, function(){
          sys.updateAll();
      });
      redValueForPixel = function(x,y) { 
	  x = Math.round(x);
	  y = Math.round(y);
          return ((y - 1) * (W * 4)) + ((x - 1) * 4) 
      }; 

      if (!(W && H)) return;
      ctx.drawImage(image, 0, 0, W, H);  
      imageData = ctx.getImageData(0, 0, W, H);  
      pixels = imageData.data;  
      sys.imageData = imageData;
      for (y=1;y<=imageData.height;y++){
	  // for (x=1;x<imageData.width;x++){
	      start = (y-1)*W*4;
	      end = start+W*4;
              line = Array.prototype.slice.apply(pixels, [start, end]);
	      l = 2*y/H - 1;
	      l = Math.acos(l); 
	      l = Math.sin(l)*H/2;
	      // if (colorA >.05) {
		  p = Sheng.create(Particle, {
		      p : Sheng.point(0,y),
		      v : Sheng.point(0,0),
		      a : null,
		      beg : Math.round(W/2-l),
		      end : Math.round(W/2+l), 
		      line: line
		  });    
		  p.dest = Sheng.point(0,y);
		  sys.add(p);
	      // }
	//  }
      }
      $("#stage-wrapper").bind("mouseover", function(e){
          e.preventDefault();
	  var el = canvas || $("#stage");
	  if ( !el.is(":animated") ) {
	      tl.start();
	      el.fadeIn("slow");
	  } else {
	      tl.start();
	      el.show();
	  }
      });
      $("#stage-wrapper").bind("mouseout", function(e){
          e.preventDefault();
	  var el = canvas || $("#stage");
	  if ( !el.is(":animated") ){
	      el.fadeOut("slow", function() {
	          tl.stop();
	      });
	  } else {
	      tl.stop();
              el.hide();
	  }
      });
});

  

