var IMG = new Image();

IMG.src = $("#logo")[0].src;


$(IMG).bind("load", function() {
      var ctx,canvas,Particle,Sys,W,H,p,sys,tl, 
          redValueForPixle,imageData, 
          pixels, spawn, image = this, x, y, colorR,
          colorG, colorB, colorA, srcImg = $("#logo")[0];

      canvas = $('#stage');
      if (! (canvas[0].getContext && (ctx=canvas[0].getContext("2d"))) ) {
	 canvas.remove();
         return 
      };
      
      W = srcImg.offsetWidth || 200;
      H = srcImg.offsetHeight || 200;

      $("#stage-wrapper").css({
          position: "absolute", 
	  top: "29px", 
	  left: "93px", 
	  backgroundImage: image.src, 
	  backgroundRepeat: "no-repeat" 
      });
      
      canvas[0].width = W;
      canvas[0].height = H;

      Particle = Sheng.Particle.extend({
          colorR : 0, 
	  colorG : 0, 
	  colorB : 0, 
	  colorA : 0
      });
      Sys = Sheng.ParticleSys.extend({
          outBound: function(p) {
              var np = p.p.clone().add(p.v).subtract(Sheng.point(W/2,H/2));
	      if (np.length()>W/2) {
	          p.bounce(np);
		  return true
	      } 
	      return false
	  }, 

	  updateAll: function() {
              
	      var a, i, j, p, d;
	      for (j=0;j<this.particles.length;j++) {
	          p = this.particles[j];
		  p.update();
		  d = p.dest.clone().subtract(p.p).scale(0.06);
		  p.v.add(d);
		  p.v.scale(Math.random()*.1+.9);
		  if ((a=d.length())<0.01){
		      p.v.set(Math.random()*50-15, Math.random()*10-5);
		      p.p.set(p.dest.clone().scale(.5));
		  }
		  i = redValueForPixel(p.p.x, p.p.y);
		  this.imageData.data[i] = p.colorR;
		  this.imageData.data[i+1] = p.colorG;
		  this.imageData.data[i+2] = p.colorB;
		  this.imageData.data[i+3] = Math.round((1-a/3)*p.colorA);
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
	  x = Math.floor(x);
	  y = Math.floor(y);
          return ((y - 1) * (W * 4)) + ((x - 1) * 4) 
      }; 

      if (!(W && H)) return;
      ctx.drawImage(image, 0, 0, W, H);  
      imageData = ctx.getImageData(0, 0, W, H);  
      pixels = imageData.data;  
      sys.imageData = imageData;
      for (x=1;x<=imageData.width;x++){
	  for (y=1;y<imageData.height;y++){
	      colorR = pixels[redValueForPixel(x,y)];
	      colorG = pixels[redValueForPixel(x,y)+1];
	      colorB = pixels[redValueForPixel(x,y)+2];
	      colorA = pixels[redValueForPixel(x,y)+3];
	      if (colorA >.05) {
		  p = Sheng.create(Particle, {
		      p : Sheng.point(x,y),
		      v : Sheng.point(Math.random()*W/10-W/14, Math.random()*H/20-H/30),
		      a : Sheng.point(-0.1,0),
		      colorR : colorR,
		      colorG : colorG,
		      colorB : colorB,
		      colorA : colorA
		  });    
		  p.dest = Sheng.point(x,y);
		  sys.add(p);
	      }
	  }
      }

      $("#stage-wrapper").bind("mouseover", function(e){
          e.preventDefault();
	  tl.start();
	  $("#stage").fadeIn("slow");
      });
      $("#stage-wrapper").bind("mouseout", function(e){
          e.preventDefault();
	  tl.stop();
	  $("#stage").fadeOut("slow");
      });
});

  

