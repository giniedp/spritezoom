(function () {
  var Loader = this.SpriteLoader = function(images, callback){
    if (typeof (images) === "string") { 
      images = [images]; 
    }
    
    this.callback = callback;
    this.numLoaded = 0;
    this.numErrors = 0;
    this.numAborts = 0;
    this.numProcessed = 0;
    this.numImages = images.length;
    this.images = [];
    var i = 0;
    for (i = 0; i < images.length; i += 1 ) {
      this.load(images[i]); 
    }
  };
  Loader.prototype.load = function(imageSource){
    var image = new Image();
    this.images.push(image);
    image.loader = this;
    image.onload = function(){
      this.loader.numLoaded += 1;
      this.loader.numProcessed += 1;
      if (this.loader.numProcessed === this.loader.numImages) { 
        this.loader.callback(this.loader); 
      }
    }; 
    
    image.onerror = function(){
      this.loader.numErrors += 1;
      this.loader.numProcessed += 1;
      if (this.loader.numProcessed === this.loader.numImages) { 
        this.loader.callback(this.loader); 
      }
    };
    
    image.onabort = function(){
      this.loader.numAborts += 1;
      this.loader.numProcessed += 1;
      if (this.loader.numProcessed === this.loader.numImages) { 
        this.loader.callback(this.loader); 
      }
    };
    image.src = imageSource;
  };
}());

(function ($) {

  $.fn.spritezoom = function(method) {
    if ( methods[method] ) {
      return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if (typeof(method) === 'object' || !method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.spritezoom' );
    }
  };

  var methods = {
    init : function(options){
      return this.each(function(){
        // Default settings
        var settings = {
          fadeInSpeed  : 500,            // general element fade in speed
          fadeOutSpeed : 300,            // general element fade out speed
          behavior     : "standard",     // name of the behavior implementation
          layout       : "inner",
          border       : 4,
          
          source       : undefined,      // the preview image
          image        : undefined,
          title        : undefined,
          
          zSource      : undefined,      // the zoom image
          zImage       : undefined,
          zTitle       : undefined
        };
        
        // Merge two objects recursively, modifying the settings.
        options = (options || {});
        $.extend(true, settings, options);

        var $this = $(this);
        var data  = $this.data('spritezoom');
        if (!data){
          // disable selection
          $this.attr("unselectable", "on");
          
          if ($this.is("a") && $this.children().first().is("img")){
            if (!settings.title){
              settings.title = $this.attr("title");
            }
            var img = $this.children().first();
            if (!settings.zTitle){
              settings.zTitle = img.attr("title");
            }
            settings.source = img.attr("src");
            settings.zSource = $this.attr("href");
            $this.click(function(){ return false; });
          }
          
          $this.empty();
          
          settings.viewEl = $("<div class='spritezoom-view'></div").appendTo($this);
          settings.tintEl = $("<div class='spritezoom-tint'></div").appendTo($this).hide();
          settings.lensEl = $("<div class='spritezoom-lens'></div").appendTo($this).hide();
          settings.zoomEl = $("<div class='spritezoom-zoom'></div>").appendTo($this).hide();
          settings.target = $this;
          settings.target.addClass("spritezoom-container");
          
          settings.touchable = (/iphone|ipod|ipad|android/i).test(navigator.userAgent);
          
          $this.data('spritezoom', settings);
          helper.reconfiger(settings);
        } else {
          $.extend(true, data, options);
          helper.reconfiger(data);
        }
      });
    },
    destroy : function(){
      return this.each(function(){
        $(this).unbind('.spritezoom').removeData('spritezoom');
      });
    },
    update : function(){
      return this.each(function(){
        helper.updateBackground($(this).data('spritezoom'));
      });
    },
    showLayer : function(names){
      var $this = $(this);
      var i, el;
      var data = $this.data('spritezoom');
      for (i = 0; i < names.length; i++){
        el = data[names[i] + "El"];
        el.show();
        if (names[i] == "tint"){
          el.css({ opacity : 0.5 });
        }
      }
    },
    hideLayer : function(names){
      var $this = $(this);
      var i, el;
      var data = $this.data('spritezoom');
      for (i = 0; i < names.length; i++){
        el = data[names[i] + "El"];
        el.hide()
      }
    }
  };
  
  var helper = {
    prevent : function(e){
      if (e.cancelable){ e.preventDefault(); }
      return false;
    },
    storePoints : function(e, data){
      if (e.touches === undefined && e.originalEvent !== undefined){
        // jQuery Event normalization does not preserve the event.touches
        // we just try to restore it from original event
        e.touches = e.originalEvent.touches;
      }
      
      // get the current mouse or touch position
      if (e.touches !== undefined && e.touches.length > 0){
        data.currentX = e.touches[0].pageX;
        data.currentY = e.touches[0].pageY;
      } else {
        data.currentX = e.pageX;
        data.currentY = e.pageY;
      }
    
      // calculate the position of the pixel in target of the small view image
      offset = data.target.offset();
      data.targetX = data.currentX - offset.left;
      data.targetY = data.currentY - offset.top;
      return false;
    },
    resetPoints : function(e, data){
      data.currentX = undefined; // current mouse X on screen
      data.currentY = undefined; // current mouse Y on screen
      data.targetX = undefined;  // mouse X relative to instance element
      data.targetY = undefined;  // mouse Y relative to instance element
    },
    clamp : function(value, min, max){
      if (value < min) return min;
      if (value > max) return max;
      return value;
    },
    reconfiger : function(data){
      new SpriteLoader([data.source, data.zSource], function(loader){
        data.image = loader.images[0];
        data.zImage = loader.images[1];
        
        helper.initializeBackground(data);
        helper.updateBackground(data);
        helper.rebindEvents(data);
        data.target.trigger("onLoad", data);
      });
    },
    initializeBackground : function(data){
      var w = data.image.width;  var zw = data.zImage.height;
      var h = data.image.height; var zh = data.zImage.height;
      data.target.css({
        position : "relative", top : 0, left : 0, 
        overflow : "visible", width : w, height : h
      }).show();
      
      var css = {
        position : "absolute", top : 0, left : 0,
        overflow : "hidden", width : w, height : h
      };
      data.tintEl.css(css);
      data.viewEl.css(css).css({
        "background-image" : ["url('", data.source, "')"].join(""),
      });
      
      var source = (data.layout == "magnify") ? data.zSource : data.source;
      data.lensEl.css(css).css({
        "background-image"    : ["url('", source, "')"].join(""),
        "background-repeat"   : "no-repeat",
        width  : Math.round(w * 0.25),
        height : Math.round(w * 0.25)
      });

      data.zoomEl.css({
        "background-image"    : ["url('", data.zSource, "')"].join(""),
        "background-repeat"   : "no-repeat",
      });        
      switch(data.layout){
        case "magnify":
          data.zoomEl.css(css).css({
            "background-image" : "none",
          });
        break;
        case "inner":
          data.zoomEl.css(css);
        break;
        case "right":
          data.zoomEl.css(css).css({
            left : css.width + data.border * 2
          });
        break;
        case "left":
          data.zoomEl.css(css).css({
            left : -(css.width + data.border * 2)
          });
        break;
        case "top":
          data.zoomEl.css(css).css({
            top : -(css.height + data.border * 2)
          });
        break;
        case "bottom":
          data.zoomEl.css(css).css({
            top : css.height + data.border * 2
          });
        break;
      }          
      if (typeof(data.layout) === "function"){
        data.layout.apply(data.zoomEl, [data]);
      }
      
      data.zoomEl.empty();
      if(data.zTitle){
        data.zoomEl.append("<div class='spritezoom-title'>" + data.zTitle + "</div>");
      }
      data.viewEl.empty();
      if(data.title){
        data.viewEl.append("<div class='spritezoom-title'>" + data.title + "</div>");
      }
    },
    updateBackground : function(data){
      var w = data.image.width;  var zw = data.zImage.width; var lw = data.lensEl.innerWidth();
      var h = data.image.height; var zh = data.zImage.height; var lh = data.lensEl.innerHeight();
      var x, y;
      
      x = data.targetX / w * zw - (w / 2);
      y = data.targetY / h * zh - (h / 2);
      x = Math.round(helper.clamp(x, 0, zw - w));
      y = Math.round(helper.clamp(y, 0, zh - h));
      data.zoomEl.css({
        "background-position" : [-x, "px ", -y, "px"].join("")
      });
      
      x = data.targetX - lw / 2;
      y = data.targetY - lh / 2;
      x = Math.round(helper.clamp(x, 0, w - lw));
      y = Math.round(helper.clamp(y, 0, h - lh));
      data.lensEl.css({
        position : "absolute", 
        top  : y, 
        left : x
      });
      
      var image = data.image;
      var source = data.source;
      if (data.layout == "magnify"){
        image = data.zImage;
        source = data.zSource;
      }
      x = data.targetX / w * image.width - (lw / 2);
      y = data.targetY / h * image.height - (lh / 2);
      x = Math.round(helper.clamp(x, 0, image.width - lw));
      y = Math.round(helper.clamp(y, 0, image.height - lh));
      data.lensEl.css({
        "background-position" : [-x, "px ", -y, "px"].join("")
      });
    },
    rebindEvents : function(data){
      var instance = data.target;
      instance.unbind('.spritezoom');
      
      instance.bind("mousemove.spritezoom", function(e){
        helper.storePoints(e, instance.data('spritezoom'));
      });
      
      var currentBehavior = data.behavior;
      if (typeof(data.behavior) === "string"){
        currentBehavior = behavior[data.behavior];
      }
      if (!currentBehavior){
        currentBehavior = behavior.none;
      }
      
      // rebind interaction events
      instance.bind('mousedown.spritezoom',  currentBehavior.mousedown || $.noop);
      instance.bind('mousemove.spritezoom',  currentBehavior.mousemove || $.noop);
      instance.bind('mouseup.spritezoom',    currentBehavior.mouseup || $.noop);
      instance.bind('mouseenter.spritezoom', currentBehavior.mouseenter || $.noop);
      instance.bind('mouseover.spritezoom',  currentBehavior.mouseover || $.noop);
      instance.bind('mouseleave.spritezoom', currentBehavior.mouseleave || $.noop);
      instance.bind('dblclick.spritezoom',   currentBehavior.dblclick || $.noop);

      if (data.touchable){
        instance.bind('touchstart.spritezoom',  currentBehavior.touchstart || $.noop);
        instance.bind('touchmove.spritezoom',   currentBehavior.touchmove || $.noop);
        instance.bind('touchend.spritezoom',    currentBehavior.touchend || $.noop);
        instance.bind('touchcancel.spritezoom', currentBehavior.touchcancel || $.noop);
        instance.bind('click.spritezoom',         helper.prevent); 
        instance.bind('gesturestart.spritezoom',  helper.prevent); 
        instance.bind('gesturechange.spritezoom', helper.prevent); 
        instance.bind('gestureend.spritezoom',    helper.prevent); 
      }
      
      if (typeof(data.onLoad) == "function"){
        instance.bind("onLoad.spritezoom", data.onLoad);
      }
    }
  };
  
  var behavior = {    
    none : {
      mousedown  : $.noop,
      mousemove  : $.noop,
      mouseup    : $.noop,
      mouseenter : $.noop,
      mouseover  : $.noop,
      mouseleave : $.noop,
      dblclick   : $.noop
    },
    standard : {
      mousedown  : $.noop,
      mousemove  : function(e){ 
        $(this).spritezoom("showLayer", ["view", "tint", "zoom", "lens"]);
        $(this).spritezoom("update");
      },
      mouseup    : $.noop,
      mouseenter : function(e, instance){
        $(this).spritezoom("update");
        $(this).spritezoom("showLayer", ["view", "tint", "zoom", "lens"]);
      },
      mouseover  : function(e, instance){ 
        $(this).spritezoom("showLayer", ["view", "tint", "zoom", "lens"]);
      },
      mouseleave : function(e, instance){ 
        $(this).spritezoom("hideLayer", ["tint", "zoom", "lens"]);
        $(this).spritezoom("update");
      },
      dblclick   : $.noop
    },
    clickZoom : {
      mousedown  : function(e, instance){
        $(this).spritezoom("showLayer", ["view", "tint", "zoom", "lens"]);
        $(this).spritezoom("update");
      },
      mousemove  : function(e, instance){ 
        $(this).spritezoom("update");
      },
      mouseup    : function(e, instance){ 
        $(this).spritezoom("hideLayer", ["tint", "zoom", "lens"]);
        $(this).spritezoom("update");
      },
      mouseenter : function(e, instance){
        $(this).spritezoom("update");
      },
      mouseover  : $.noop,
      mouseleave : function(e, instance){ 
        $(this).spritezoom("hideLayer", ["tint", "zoom", "lens"]);
        $(this).spritezoom("update");
      },
      dblclick   : $.noop
    }
  };
}(jQuery));
