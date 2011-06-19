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
          fadeInSpeed       : 500,            // general element fade in speed
          fadeOutSpeed      : 300,            // general element fade out speed
          behavior          : "standard",     // name of the behavior implementation
          
          targetCss : {
            display : "block",
            border   : "4px solid #ccc",
            margin   : "-4px"
          },
          viewLayer : {
            layerElement : null,
            imageElement : null,
            imageUrl     : undefined,
            imageWidth   : undefined,
            imageHeight  : undefined,
            opacity      : 1.0,
            fadeInSpeed  : undefined,
            fadeOutSpeed : undefined,
            css          : {
	            overflow : "hidden"            
            }
          },
          
          tintLayer : {
            layerElement : null,
            opacity      : 0.5,
            fadeInSpeed  : undefined,
            fadeOutSpeed : undefined,
            css          : {
              "background"          : "#888",
              "background-position" : "2px 2px",    
              "background-repeat"   : "no-repeat"
            }
          },
          
          zoomLayer : {
            layerElement : null,
            imageElement : null,
            imageUrl     : undefined,
            imageWidth   : undefined,
            imageHeight  : undefined,
            opacity      : 1.0,
            fadeInSpeed  : undefined,
            fadeOutSpeed : undefined,
            css          : {        
              border   : "4px solid #ccc",
              margin   : "-4px"
            },
            layout : "right",                   // "inner", "top", "right", "left", "bottom", function 
            layoutOffset : {
              top : 0,
              left: 12
            }
          },
          
          lensLayer : {
            layerElement : null,
            imageElement : null,
            imageUrl     : undefined,
            imageWidth   : undefined,
            imageHeight  : undefined,
            opacity      : 1.0,
            fadeInSpeed  : undefined,
            fadeOutSpeed : undefined,
            css          : {
              overflow : "hidden",
              border   : "4px solid #888",
	            margin   : "-4px",
	            cursor   : "move"       
            },
            offset : undefined
          },
          
          mouseLayer : {
            layerElement : null
          }
        };
        
        // Merge two objects recursively, modifying the settings.
        options = (options || {});
        $.extend(true, settings, options);

        var $this = $(this);
        var data  = $this.data('spritezoom');

        if (!data){
          // disable selection
          $this.attr("unselectable", "on");
          
          // check if we have a "fallback" html structure that wont break the website
          // when javascript is disabled. This consists of an "a" tag wrapping an "img" tag,
          // where the "a" tag links to the large image and the "img" tag shows a small version.
          // Read the image urls from that structure.
          //
          // <a href="path/to/zoom/image.png">
          //   <img src="path/to/image.png"/>
          // </a>
          if ($this.is("a") && $this.children().first().is("img")){
            settings.viewLayer.imageUrl = $this.children().first().attr("src");
            settings.zoomLayer.imageUrl = $this.attr("href");
            $this.click(function(){ return false; });
          }
          
          if (!settings.lensLayer.imageUrl){
            settings.lensLayer.imageUrl = settings.viewLayer.imageUrl;
          }
          
          // clear the html
          $this.empty();
          
          // Build the html for each layer
          
          // VIEW LAYER
          //   <div class="spritezoom-view">
          //     <img src=""></img>
          //   </div>
          settings.viewLayer.layerElement = $("<div class='spritezoom-view'> <img src='" + settings.viewLayer.imageUrl + "'/> </div");
          settings.viewLayer.imageElement = settings.viewLayer.layerElement.find("img");
          $this.append(settings.viewLayer.layerElement);
          
          // TINT LAYER
          //   <div class="spritezoom-tint"></div>
          settings.tintLayer.layerElement = $("<div class='spritezoom-tint'></div");
          $this.append(settings.tintLayer.layerElement);
          settings.tintLayer.layerElement.hide();
          
          // LENS LAYER
          //   <div class="spritezoom-lens">
          //     <img src=""></img>
          //   </div>
          settings.lensLayer.layerElement = $("<div class='spritezoom-lens'> <img src='" + settings.lensLayer.imageUrl + "'/> </div");
          settings.lensLayer.imageElement = settings.lensLayer.layerElement.find("img");
          $this.append(settings.lensLayer.layerElement);
          settings.lensLayer.layerElement.hide();
          
          // ZOOM LAYER
          //   <div class="spritezoom-zoom">
          //     <img src=""></img>
          //   </div>
          if (!settings.zoomLayer.layerElement){
            settings.zoomLayer.layerElement = $("<div class='spritezoom-zoom'></div>");
            $this.append(settings.zoomLayer.layerElement);
          }
          if (settings.zoomLayer.layerElement.find("img").length === 0){
            settings.zoomLayer.layerElement.append("<img src='" + settings.zoomLayer.imageUrl + "'/>");
          }
          settings.zoomLayer.imageElement = settings.zoomLayer.layerElement.find("img");
          settings.zoomLayer.layerElement.hide();
          
          
          // MOUSE LAYER
          //   <div class="spritezoom.mouse"></div>
          settings.mouseLayer.layerElement = $("<div class='spritezoom-mouse'/>");
          $this.append(settings.mouseLayer.layerElement);
          
          // apply css
          settings.viewLayer.layerElement.css(settings.viewLayer.css);
          settings.zoomLayer.layerElement.css(settings.zoomLayer.css);
          settings.tintLayer.layerElement.css(settings.tintLayer.css);
          settings.lensLayer.layerElement.css(settings.lensLayer.css);
          
          // Initialize the plugin if it hasn't been initialized yet
          $this.data('spritezoom', {
            target    : $this,
            settings  : settings,
            touchable : (/iphone|ipod|ipad|android/i).test(navigator.userAgent)
          });

          // run configuration
          data = $this.data('spritezoom');
          
          helper.reconfiger($this, data);
        } else {
          // re setup the plugin if it is already initialized
          $.extend(true, data.settings, options);
          
          // TODO: allow the plugin to recofiger itself
        }
      });
    },
    destroy : function(){
      return this.each(function(){
        var $this = $(this);
        var data = $this.data('spritezoom');
        $this.unbind('.spritezoom');
        $this.removeData('spritezoom');
      });
    },
    // Updates a single frame
    // Triggers the onFrame event
    update : function(){
      return this.each(function(){
        var $this = $(this);
        var data = $this.data('spritezoom');

        helper.updateBackground($this, data);
      });
    },
    showLayer : function(names){
      var $this = $(this);
      var i;
      var data = $this.data('spritezoom');
      for (i = 0; i < names.length; i++){
        options = helper.getLayerOptions(names[i], data);
        
        if (options.layerElement && !options.layerIsVisible){
          options.layerElement.fadeTo(options.fadeInSpeed || data.settings.fadeInSpeed, options.opacity);
          options.layerIsHidden = false;
          options.layerIsVisible = true;
        }
      }
    },
    hideLayer : function(names){
      var $this = $(this);
      var i;
      var data = $this.data('spritezoom');
      for (i = 0; i < names.length; i++){
        options = helper.getLayerOptions(names[i], data);
        
        if (options.layerElement && !options.layerIsHidden){
          options.layerElement.fadeOut(options.fadeOutSpeed || data.settings.fadeOutSpeed);
          options.layerIsHidden = true;
          options.layerIsVisible = false;
        }
      }
    }
  };
  
  var helper = {
    prevent : function(e){
      if (e.cancelable){
        e.preventDefault();
      }
      return false;
    },
    // the delegate is used to fetch an event from the mouseLayer
    // and call the appropriate method from the behavior implementation
    // passing the spritezoom instance and the event as arguments
    eventDelegate : function(e){
      // resolve the spritezoom instance which is expected to be the parent element
      // this is true when the eventDelegate is called on the mouseLayer which
      // always is the child of the spritezoom container
      var $this = $(this).parent();
      var data = $this.data('spritezoom');
      
      // determine the behavior implementation
      var currentBehavior = data.settings.behavior;
      if (typeof(data.settings.behavior) === "string"){
        currentBehavior = behavior[data.settings.behavior];
      }
    
      // call the behavior implementation
      currentBehavior[e.type].apply($this, [e, $this, data]);
      return true;
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
      offset = data.settings.viewLayer.imageElement.offset();
      data.targetX = data.currentX - offset.left;
      data.targetY = data.currentY - offset.top;
      
      // usually the value of the focused position will be accumulated with
      // a smoothing function. However, we set it to the target value if it is 
      // not defined.
      if (data.focusX === undefined){ data.focusX = data.targetX; }
      if (data.focusY === undefined){ data.focusY = data.targetY; }
    
      data.focusX = data.targetX;
      data.focusY = data.targetY;
      return false;
    },
    resetPoints : function(e, data){
      // current mouse position on screen
      data.currentX = undefined;
      data.currentY = undefined;
      // current mouse position relative to the view image
      // this is the image point we want to have in center of the zoom view
      data.targetX = undefined;
      data.targetY = undefined;
      // this is the image point that is currently in center of the zoom view 
      data.focusX = undefined;
      data.focusY = undefined;
    },
    getLayerOptions : function(name, data){
      switch(name){
        case "view":
          return data.settings.viewLayer;
        case "zoom":
          return data.settings.zoomLayer;
        case "tint":
          return data.settings.tintLayer;
        case "lens":
          return data.settings.lensLayer;
      }
      return {};
    },
    cacheImageSize : function(name, data){
      var options = helper.getLayerOptions(name, data);
      if (options.imageElement){
        options.imageWidth  = options.imageElement.innerWidth();
        options.imageHeight = options.imageElement.innerHeight();        
      }
    },
    cacheLayerSize : function(name, data){
      var options = helper.getLayerOptions(name, data);
      if (options.layerElement){
        options.layerWidth  = options.layerElement.innerWidth();
        options.layerHeight = options.layerElement.innerHeight();        
      }
    },
    cacheImageSizes : function(data, names){
      var i;
      for(i = 0; i < names.length; i++){
        helper.cacheImageSize(names[i], data);
      }
    },
    cacheLayerSizes : function(data, names){
      var i;
      for(i = 0; i < names.length; i++){
        helper.cacheLayerSize(names[i], data);
      }
    },
    clamp : function(value, min, max){
      if (value < min){ return min; }
      if (value > max){ return max; }
      return value;
    },
    wrapValue : function(value, min, max){
      while (value >= max){ value -= max; } 
      while (value < min){ value += max; }
      return value;
    },
    reconfiger : function(instance, data){
      helper.preloadImages(instance, data, function(){
        // need to make these layers visible to be able to
        // cache the elements sizes. Otherwise
        // we the width and height will be zero
        data.settings.zoomLayer.layerElement.show();
        data.settings.tintLayer.layerElement.show();
        data.settings.lensLayer.layerElement.show();
        
        helper.cacheImageSizes(data, ["view", "tint", "zoom", "lens"]);
        helper.initializeBackground(instance, data);
        helper.cacheLayerSizes(data, ["view", "tint", "zoom", "lens"]);
        
        data.settings.zoomLayer.layerElement.hide();
        data.settings.tintLayer.layerElement.hide();
        data.settings.lensLayer.layerElement.hide();
        
        helper.updateBackground(instance, data);
        helper.rebindEvents(instance, data);
        instance.trigger("onLoad", data);
      });
    },
    initializeBackground : function(instance, data){
      var view = data.settings.viewLayer;
      var tint = data.settings.tintLayer;
      var zoom = data.settings.zoomLayer;
      var lens = data.settings.lensLayer;
      var mouse = data.settings.mouseLayer;

      var reference = data.settings.viewLayer;
      var offset    = { top : 0, left : 0 };
      var defaultCss = {
        position : "absolute",
        top      : offset.top,
        left     : offset.left,
        width    : reference.imageWidth,
        height   : reference.imageHeight,
        overflow : "hidden"
      };
      
      instance.css(defaultCss).css({ 
        position : "relative", 
        top : 0, 
        left : 0, 
        overflow : "visible" 
      }).css(data.settings.targetCss);
      mouse.layerElement.css(defaultCss);  
      view.layerElement.css(defaultCss);  
      tint.layerElement.css(defaultCss);
      
      var zoomCss = { };
      if (typeof(data.settings.zoomLayer.layout) === "function"){
        zoomCss = data.settings.zoomLayer.layout.apply(instance, [instance, data]);
      } else {
        switch(data.settings.zoomLayer.layout){
          case "inner":
            zoomCss = {
              position : "absolute",
              top      : offset.top,
              left     : offset.left,
              width    : reference.imageWidth,
              height   : reference.imageHeight
            };
          break;
          case "right":
            zoomCss = {
              position : "absolute",
              top      : offset.top,
              left     : offset.left + reference.imageWidth,
              width    : reference.imageWidth,
              height   : reference.imageHeight
            };
          break;
          case "top":
            zoomCss = {
              position : "absolute",
              top      : offset.top - reference.imageHeight,
              left     : offset.left,
              width    : reference.imageWidth,
              height   : reference.imageHeight
            };
          break;
          case "bottom":
            zoomCss = {
              position : "absolute",
              top      : offset.top + reference.imageHeight,
              left     : offset.left,
              width    : reference.imageWidth,
              height   : reference.imageHeight
            };
          break;
        }
      }
      zoomCss.top += data.settings.zoomLayer.layoutOffset.top;
      zoomCss.left += data.settings.zoomLayer.layoutOffset.left;
      
      $.extend(zoomCss, { overflow : "hidden"});
      data.settings.zoomLayer.layerElement.css(zoomCss);
      
      if (lens.css.width === undefined || lens.css.height === undefined){
        lens.layerElement.css({
          width  : view.imageWidth * (view.imageWidth / zoom.imageWidth),
          height : view.imageHeight * (view.imageHeight / zoom.imageHeight)
        });        
      }
    },
    updateBackground : function(instance, data){
      var view = data.settings.viewLayer;
      var zoom = data.settings.zoomLayer;
      var lens = data.settings.lensLayer;
      
      var focusX = data.focusX || 0;
      var focusY = data.focusY || 0;
      
      var scaleX = zoom.imageWidth  / view.imageWidth;
      var scaleY = zoom.imageHeight / view.imageHeight;
      
      var x = (zoom.layerWidth  / 2) - focusX * scaleX;
      var y = (zoom.layerHeight / 2) - focusY * scaleY;
      x = helper.clamp(x, zoom.layerWidth  - zoom.imageWidth,  0);
      y = helper.clamp(y, zoom.layerHeight - zoom.imageHeight, 0);
      
      zoom.imageElement.css({
        position : "absolute",
        top : y,
        left: x
      });
      
      var offset = view.imageElement.position();

      var lensX = focusX - lens.layerWidth  / 2;
      var lensY = focusY - lens.layerHeight / 2;

      switch(typeof(lens.offset)){
        case "object":
          lensX = focusX + lens.offset.left;
          lensY = focusY + lens.offset.top;
        break;
        case "function":
          result = lens.offset.apply(instance, [instance, data]);
          lensX = focusX + result.left;
          lensY = focusY + result.top;
        break;
      }

      lensX = helper.clamp(lensX, offset.left, offset.left + view.layerWidth  - lens.layerWidth);
      lensY = helper.clamp(lensY, offset.top , offset.top  + view.layerHeight - lens.layerHeight);

      lens.layerElement.css({
        position : "absolute",
        top  : lensY,
        left : lensX
      });
      
      scaleX = lens.imageWidth  / view.imageWidth;
      scaleY = lens.imageHeight / view.imageHeight;
      
      x = (lens.layerWidth  / 2) - focusX * scaleX;
      y = (lens.layerHeight / 2) - focusY * scaleY;
      x = helper.clamp(x, lens.layerWidth  - lens.imageWidth,  0);
      y = helper.clamp(y, lens.layerHeight - lens.imageHeight, 0);

      lens.imageElement.css({
        position : "relative",
        top : y,
        left: x
      });
    },
    rebindEvents : function(instance, data){
      eventReceiver = data.settings.mouseLayer.layerElement;
      
      // unbind all events
      instance.unbind('.spritezoom');
      eventReceiver.unbind('.spritezoom');
      
      instance.bind("mousemove.spritezoom", function(e){
        helper.storePoints(e, instance.data('spritezoom'));
      });
      
      // rebind interaction events
      eventReceiver.bind('mousedown.spritezoom',  helper.eventDelegate);
      eventReceiver.bind('mousemove.spritezoom',  helper.eventDelegate);
      eventReceiver.bind('mouseup.spritezoom',    helper.eventDelegate);
      eventReceiver.bind('mouseenter.spritezoom', helper.eventDelegate);
      eventReceiver.bind('mouseover.spritezoom',  helper.eventDelegate);
      eventReceiver.bind('mouseleave.spritezoom', helper.eventDelegate);
      eventReceiver.bind('dblclick.spritezoom',   helper.eventDelegate);

      if (data.touchable){
        eventReceiver.bind('touchstart.spritezoom',  helper.eventDelegate);
        eventReceiver.bind('touchmove.spritezoom',   helper.eventDelegate);
        eventReceiver.bind('touchend.spritezoom',    helper.eventDelegate);
        eventReceiver.bind('touchcancel.spritezoom', helper.eventDelegate);
        eventReceiver.bind('click.spritezoom',         helper.prevent); 
        eventReceiver.bind('gesturestart.spritezoom',  helper.prevent); 
        eventReceiver.bind('gesturechange.spritezoom', helper.prevent); 
        eventReceiver.bind('gestureend.spritezoom',    helper.prevent); 
      }
              
      // disable selection
	    instance.bind("mousedown.spritezoom selectstart.spritezoom", helper.prevent);
	    
	    if (data.settings.onLoad !== undefined){
	      instance.bind("onLoad.spritezoom", data.settings.onLoad);
	    }
    },
    preloadImages : function(instance, data, callback) {
      var preload = $('<div class="spritezoom-preload"/>');
      if (instance.find(".spritezoom-preload").length === 0){
        instance.append(preload);
      }      

      preload.css({
        position : "absolute",
        top    : data.settings.viewLayer.layerElement.offset().top,
        left   : data.settings.viewLayer.layerElement.offset().left,
        width  : data.settings.viewLayer.layerElement.outerWidth(),
        height : data.settings.viewLayer.layerElement.outerHeight()
      });
      preload.css( data.settings.preloadCss || {} );
      preload.hide().html( data.settings.preloadHtml || " ").fadeIn(data.settings.fadeOutSpeed || 250, function(){
        new SpriteLoader([data.settings.viewLayer.imageUrl, data.settings.zoomLayer.imageUrl], function(){
          instance.find(".spritezoom-preload").fadeOut(data.settings.fadeInSpeed || 250, function(){ $(this).detach(); });
          callback.apply(instance, [data]);
        });
      });
    }
  };
  
  function SpriteLoader(images, callback){
    if (typeof(images) === "string"){ images = [images]; }
    
    this.callback = callback;
    this.numLoaded = 0;
    this.numErrors = 0;
    this.numAborts = 0;
    this.numProcessed = 0;
    this.numImages = images.length;
    this.images = [];
    var i = 0;
    for (i = 0; i < images.length; i++ ) {
      this.preload(images[i]); 
    }
  }
  SpriteLoader.prototype.preload = function(imageUrl){
     // create new Image object and add to array
     var image = new Image();
     this.images.push(image);
  
     // set up event handlers for the Image object
     image.onload = SpriteLoader.prototype.onload;
     image.onerror = SpriteLoader.prototype.onerror;
     image.onabort = SpriteLoader.prototype.onabort;
  
     // assign pointer back to this.
     image.preloader = this;
  
     // assign the .src property of the Image object to start loading
     image.src = imageUrl;
  };
  SpriteLoader.prototype.onProcessed = function(){
    this.numProcessed++;
    if ( this.numProcessed === this.numImages ){
      this.callback(this.images, this.numLoaded);
    }
  };
  SpriteLoader.prototype.onload = function(){
    this.preloader.numLoaded++;
    this.preloader.onProcessed();
  };
  SpriteLoader.prototype.onerror = function(){
    this.preloader.numErrors++;
    this.preloader.onProcessed();
  };
  SpriteLoader.prototype.onabort = function(){
    this.preloader.numAborts++;
    this.preloader.onProcessed();
  };
  
  var behavior = {    
    none : {
      mousedown  : function(e){ return false; },
      mousemove  : function(e){ return false; },
      mouseup    : function(e){ return false; },
      
      mouseenter : function(e){ return false; },
      mouseover  : function(e){ return false; },
      mouseleave : function(e){ return false; },
      dblclick   : function(e){ return false; }
    },
    standard : {
      mousedown  : function(e, instance){
        return false; 
      },
      mousemove  : function(e, instance){ 
        instance.spritezoom("showLayer", ["view", "tint", "zoom", "lens"]);
        instance.spritezoom("update");
        return false; 
      },
      mouseup    : function(e, instance){ 
        return false; 
      },
      mouseenter : function(e, instance){
        instance.spritezoom("update");
        instance.spritezoom("showLayer", ["view", "tint", "zoom", "lens"]);
        return false; 
      },
      mouseover  : function(e, instance){ 
        instance.spritezoom("showLayer", ["view", "tint", "zoom", "lens"]);
        return false; 
      },
      mouseleave : function(e, instance){ 
        instance.spritezoom("hideLayer", ["tint", "zoom", "lens"]);
        instance.spritezoom("update");
        return false; 
      },
      dblclick   : function(e, instance){ 
        return false; 
      }
    },
    clickZoom : {
      mousedown  : function(e, instance){
        instance.spritezoom("showLayer", ["view", "tint", "zoom", "lens"]);
        instance.spritezoom("update");
        return false; 
      },
      mousemove  : function(e, instance){ 
        instance.spritezoom("update");
        return false; 
      },
      mouseup    : function(e, instance){ 
        instance.spritezoom("hideLayer", ["tint", "zoom", "lens"]);
        instance.spritezoom("update");
        return false; 
      },
      mouseenter : function(e, instance){
        instance.spritezoom("update");        
        return false; 
      },
      mouseover  : function(e, instance){ 
        return false; 
      },
      mouseleave : function(e, instance){ 
        instance.spritezoom("hideLayer", ["tint", "zoom", "lens"]);
        instance.spritezoom("update");
        return false; 
      },
      dblclick   : function(e, instance){ 
        return false; 
      }
    }
  };
}(jQuery));
