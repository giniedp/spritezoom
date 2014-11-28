(function ($) {
  var behavior = {
    hover : {
      mousedown  : $.noop,
      mousemove  : function(e, data){ 
        data.target.spritezoom("showLayer", ["view", "tint", "zoom", "lens"]);
        data.target.spritezoom("update");
      },
      mouseup    : $.noop,
      mouseenter : function(e, data){
        data.target.spritezoom("update");
        data.target.spritezoom("showLayer", ["view", "tint", "zoom", "lens"]);
      },
      mouseover  : function(e, data){ 
        data.target.spritezoom("showLayer", ["view", "tint", "zoom", "lens"]);
      },
      mouseleave : function(e, data){ 
        data.target.spritezoom("hideLayer", ["tint", "zoom", "lens"]);
        data.target.spritezoom("update");
      },
      dblclick   : $.noop
    },
    click : {
      mousedown  : function(e, data){
        data.target.spritezoom("showLayer", ["view", "tint", "zoom", "lens"]);
        data.target.spritezoom("update");
      },
      mousemove  : function(e, data){ 
        data.target.spritezoom("update");
      },
      mouseup    : function(e, data){ 
        data.target.spritezoom("hideLayer", ["tint", "zoom", "lens"]);
        data.target.spritezoom("update");
      },
      mouseenter : function(e, data){
        data.target.spritezoom("update");
      },
      mouseover  : $.noop,
      mouseleave : function(e, data){ 
        data.target.spritezoom("hideLayer", ["tint", "zoom", "lens"]);
        data.target.spritezoom("update");
      },
      dblclick   : $.noop
    }
  };

  var methods = {
    init : function(options){
      return this.each(function(){
        // Default settings
        var settings = {
          fadeInSpeed  : 500,            // general element fade in speed
          fadeOutSpeed : 300,            // general element fade out speed
          behavior     : "hover",        // interaction strategy
          layout       : "inner",        // layout strategy. may be "inner", "top", "right", "bottom", "left", "magnify" or empty
          border       : 4,              // invisible border around the view. Used to offset the zoom layer
          magSize      : 0.3,
          // parameter for the preview image
          source       : undefined,      // the uri to the image
          image        : undefined,      // the loaded image object (is set by this script)
          title        : undefined,      // the optional title for the preview image
          width        : undefined,      // the width of the image or of the visible portion of the image
          height       : undefined,      // the height of the image or of the visible portion of the image
          offset       : undefined,      // offset to the visible portion of the image
          // parameter for the zoom image
          zSource      : undefined,
          zImage       : undefined,
          zTitle       : undefined,
          zWidth       : undefined,
          zHeight      : undefined,
          zOffset      : undefined
        };        
        // Merge two objects recursively, modifying the settings.
        options = (options || {});
        $.extend(true, settings, options);

        var $this = $(this);
        var data  = $this.data('spritezoom');
        if (!data){
          // IE6 flicker fix
          try { document.execCommand("BackgroundImageCache", false, true); } catch (e) {}

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
          // build html
          $this.empty();
          settings.viewEl = $("<div class='spritezoom-view'></div>").appendTo($this);
          settings.tintEl = $("<div class='spritezoom-tint'></div>").appendTo($this).hide();
          settings.lensEl = $("<div class='spritezoom-lens'></div>").appendTo($this).hide();
          settings.zoomEl = $("<div class='spritezoom-zoom'></div>").appendTo($this).hide();
          settings.sensEl = $("<div class='spritezoom-sens'></div>").appendTo($this);
          settings.target = $this;
          settings.target.addClass("spritezoom-instance");
          // helper variables per layer
          settings.view = { el : settings.viewEl, opacity : 1.0 };
          settings.tint = { el : settings.tintEl, opacity : 0.5 };
          settings.lens = { el : settings.lensEl, opacity : 1.0 };
          settings.zoom = { el : settings.zoomEl, opacity : 1.0 };
          settings.touchable = (/iphone|ipod|ipad|android/i).test(navigator.userAgent);
          // set data and reload plugin
          $this.data('spritezoom', settings);
          helper.reload(settings);
        } else {
          // update data and reload plugin
          $.extend(true, data, options);
          helper.reload(data);
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
      var i, d, data = $this.data('spritezoom');
      for (i = 0; i < names.length; i++){
        d = data[names[i]];
        if (d.fadingOut || !d.fadingIn){
          d.fadingOut = false; 
          d.fadingIn = true;
          d.el.stop(false, true).fadeTo(data.fadeInSpeed, d.opacity, function(){
            d.fadingIn = false;
          });
        }
      }
    },
    hideLayer : function(names){
      var $this = $(this);
      var i, d, data = $this.data('spritezoom');
      for (i = 0; i < names.length; i++){
        d  = data[names[i]];
        if (!d.fadingOut || d.fadingIn){
          d.fadingOut = true;
          d.fadingIn = false;
          d.el.stop(false, true).fadeTo(data.fadeOutSpeed, 0, function(){
            d.fadingOut = false;
          });
        }
      }
    }
  };
  
  var helper = {
    wrap: function(callback, data){
      if (typeof callback === "function"){
        return function(e){
          callback.apply(data.target, [e, data]);
        };
      }
      return $.noop;
    },
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
      var offset = data.target.offset();
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
      if (value < min) { return min; }
      if (value > max) { return max; }
      return value;
    },
    reload : function(data){
      var loaded = 0;
      var image = new Image();
      var zImage = new Image();
      var onload = function(){ 
        loaded += 1;
        if (loaded == 2){
          data.image = image;
          data.zImage = zImage;
          helper.reconfiger(data);
        }
      };
      image.onload = zImage.onload = onload;
      image.src = data.source;
      zImage.src = data.zSource;
    },
    reconfiger : function(data){
      //new SpriteLoader([data.source, data.zSource], function(loader){
        //data.image   = loader.images[0];
        data.width   = (data.width  || data.image.width);
        data.height  = (data.height || data.image.height);
        data.offset  = (data.offset || { x:0, y:0 });
        //data.zImage  = loader.images[1];
        data.zWidth  = (data.zWidth  || data.zImage.width);
        data.zHeight = (data.zHeight || data.zImage.height);
        data.zOffset = (data.zOffset || { x:0, y:0 });
        
        helper.initializeBackground(data);
        helper.updateBackground(data);
        helper.rebindEvents(data);
        data.target.trigger("onLoad", data);
      //});
    },
    initializeBackground : function(data){
      var w = data.width;  var zw = data.zWidth;
      var h = data.height; var zh = data.zHeight;
      data.target.css({
        position : "relative", top : 0, left : 0, 
        overflow : "visible", 
        width : w, height : h
      });
      
      var css = {
        position : "absolute", top : 0, left : 0,
        overflow : "hidden", width : w, height : h
      };
      data.sensEl.css(css);
      data.tintEl.css(css);
      data.viewEl.css(css).css({
        "background-image"  : ["url('", data.source, "')"].join(""),
        "background-repeat" : "no-repeat",
        "background-position" : [-data.offset.x, "px ", -data.offset.y, "px"].join("")
      });
      
      var source = (data.layout == "magnify") ? data.zSource : data.source;
      data.lensEl.css(css).css({
        "background-image"    : ["url('", source, "')"].join(""),
        "background-repeat"   : "no-repeat",
        "background-position" : [-data.offset.x, "px ", -data.offset.y, "px"].join(""),
        width  : Math.round(w * data.magSize),
        height : Math.round(w * data.magSize)
      });

      data.zoomEl.css({
        "background-image"    : ["url('", data.zSource, "')"].join(""),
        "background-repeat"   : "no-repeat",
        "background-position" : [-data.zOffset.x, "px ", -data.zOffset.y, "px"].join("")
      });        
      switch(data.layout){
        case "magnify":
          data.zoomEl.css(css).css({
            "background-image" : "none"
          });
        break;
        case "inner":
          data.zoomEl.css(css);
          data.lensEl.remove();
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
      var w = data.width;  var zw = data.zWidth;  var lw = data.lensEl.innerWidth();
      var h = data.height; var zh = data.zHeight; var lh = data.lensEl.innerHeight();
      var x, y;
      
      x = Math.round(data.targetX / w * zw - w * 0.5);
      y = Math.round(data.targetY / h * zh - w * 0.5);
      x = helper.clamp(x, 0, zw - w) + data.zOffset.x;
      y = helper.clamp(y, 0, zh - h) + data.zOffset.y;
      data.zoomEl.css({
        "background-position" : [-x, "px ", -y, "px"].join("")
      });
      
      x = Math.round(data.targetX - lw * 0.5);
      y = Math.round(data.targetY - lh * 0.5);
      x = helper.clamp(x, 0, w - lw);
      y = helper.clamp(y, 0, h - lh);
      data.lensEl.css({
        position : "absolute", 
        top  : y, 
        left : x
      });
      
      var w2 = data.width; 
      var h2 = data.height;
      var source = data.source;
      var offset = data.offset;
      if (data.layout == "magnify"){
        w2 = data.zWidth; h2 = data.zHeight;
        source = data.zSource;
        offset = data.zOffset;
      }
      x = Math.round((data.targetX / w) * w2 - (lw * 0.5));
      y = Math.round((data.targetY / h) * h2 - (lh * 0.5));
      x = helper.clamp(x, 0, w2 - lw) + offset.x;
      y = helper.clamp(y, 0, h2 - lh) + offset.y;
      data.lensEl.css({
        "background-position" : [-x, "px ", -y, "px"].join("")
      });
    },
    rebindEvents : function(data){
      var $this = data.target;
      var sens = data.sensEl;
      $this.unbind('.spritezoom');
      sens.unbind('.spritezoom');
      
      sens.bind("mousemove.spritezoom", function(e){
        helper.storePoints(e, $this.data('spritezoom'));
      });
      
      var beh = data.behavior || {};
      if (typeof beh === "string"){
        beh = behavior[data.behavior] || {};
      }
      
      // rebind interaction events
      
      sens.bind('mousedown.spritezoom',  helper.wrap(beh.mousedown, data));
      sens.bind('mousemove.spritezoom',  helper.wrap(beh.mousemove, data));
      sens.bind('mouseup.spritezoom',    helper.wrap(beh.mouseup, data));
      sens.bind('mouseenter.spritezoom', helper.wrap(beh.mouseenter, data));
      sens.bind('mouseover.spritezoom',  helper.wrap(beh.mouseover, data));
      sens.bind('mouseleave.spritezoom', helper.wrap(beh.mouseleave, data));
      sens.bind('dblclick.spritezoom',   helper.wrap(beh.dblclick, data));

      if (data.touchable){
        sens.bind('touchstart.spritezoom',  helper.wrap(beh.touchstart, data));
        sens.bind('touchmove.spritezoom',   helper.wrap(beh.touchmove, data));
        sens.bind('touchend.spritezoom',    helper.wrap(beh.touchend, data));
        sens.bind('touchcancel.spritezoom', helper.wrap(beh.touchcancel, data));
        sens.bind('click.spritezoom',         helper.prevent); 
        sens.bind('gesturestart.spritezoom',  helper.prevent); 
        sens.bind('gesturechange.spritezoom', helper.prevent); 
        sens.bind('gestureend.spritezoom',    helper.prevent); 
      }
      
      if (typeof(data.onLoad) == "function"){
        $this.bind("onLoad.spritezoom", data.onLoad);
      }
    }
  };

  $.fn.spritezoom = function(method) {
    if ( methods[method] ) {
      return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    }
    if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    }
    $.error( 'Method ' +  method + ' does not exist on jQuery.spritezoom' );
  };
}(window.jQuery));
