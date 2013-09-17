(function (window, document) {

    'use strict';

    var $, Imager;

    window.requestAnimationFrame =
    window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60);
    };


    $ = (function (dollar) {
        if (dollar) {
            return dollar;
        }

        return function (selector) {
            return Array.prototype.slice.call(document.querySelectorAll(selector));
        };
    }(window.$));


    /*
        Construct a new Imager instance, passing an optional configuration object.

        Example usage:

            {
                // Available widths for your images
                availableWidths: [Number]

                // Selector to be used to locate your div placeholders
                selector: '',

                // Class name to give your resizable images.
                className: '',

                // Regular expression to match against your image endpoint's naming conventions
                // e.g. http://yourserver.com/image/horse/400
                regex: RegExp
            }

        @param {object} configuration settings
        @return {object} instance of Imager
     */
    window.Imager = Imager = function (opts) {
        var self = this;
            opts = opts || {};

        this.availableWidths  = opts.availableWidths || [160,320,640,1440];//{
        this.selector         = opts.selector || '.imager';
        this.className        = '.' + (opts.className || 'image-replace').replace(/^\.+/, '.');
        this.regex            = opts.regex || /\/image\/(\d)\/(\d+)\/(\d+)\/?(\d)?\/?([0-9a-fA-F]{3,6})?\/?(.+)$/i;
        this.gif              = document.createElement('img');
        this.gif.src          = 'data:image/gif;base64,R0lGODlhEAAJAIAAAP///wAAACH5BAEAAAAALAAAAAAQAAkAAAIKhI+py+0Po5yUFQA7';
        this.gif.className    = this.className.replace(/^[#.]/, '');
        this.divs             = $(this.selector);
        this.cache            = {};
        this.retina           = opts.retina === false ? false : true;
        this.isRetina         = false; // see init()
        this.debounce         = opts.debounce === false ? false : true;
        this.interval         = opts.interval || 200;
        this.preload          = opts.preload || false;
        this.events           = opts.events || false;
        this.eventsBubble     = opts.eventsBubble === false ? false : true;
        this.eventsCancelable = opts.eventsCancelable === false ? false : true;
        this.eventsRetina     = opts.eventsRetina === false ? false : true;
        this.changeDivsToEmptyImages();

        window.requestAnimationFrame(function(){
            self.init();
        });
    };


    Imager.prototype.init = function () {
        var self = this;

        this.initialized = true;
        // init isRetina here rather than in opts init above so that the
        // retinaStatus event gets broadcast at initial page load
        this.isRetina = this.determineIfRetina();

        this.checkImagesNeedReplacing();

        if (this.debounce) {
            window.addEventListener('resize', this.debouncer(function(){
                self.isRetina = self.determineIfRetina();
                self.checkImagesNeedReplacing();
            }, self.interval, false), false);
        } else {
            window.addEventListener('resize', function(){
                self.isRetina = self.determineIfRetina();
                self.checkImagesNeedReplacing();
            }, false);
        }
    };


    Imager.prototype.changeDivsToEmptyImages = function () {
        var divs = this.divs,
            i = divs.length,
            gif;

        while (i--) {
            gif = this.gif.cloneNode(false);
            gif.width = divs[i].getAttribute('data-width');
            gif.setAttribute('data-src', divs[i].getAttribute('data-src'));
            divs[i].parentNode.replaceChild(gif, divs[i]);
        }

        if (this.initialized) {
            this.checkImagesNeedReplacing();
        }
    };


    Imager.prototype.checkImagesNeedReplacing = function () {
        var self = this,
            images = $(this.className),
            i = images.length;

        if (!this.isResizing) {
            this.isResizing = true;

            this.announce('imagerjs.startReplacement', {count: images.length});
            while (i--) {
                this.replaceImagesBasedOnScreenDimensions(images[i]);
            }

            this.isResizing = false;
        }
    };

    Imager.prototype.replaceImagesBasedOnScreenDimensions = function (image) {
        var src = this.determineAppropriateResolution(image),
            parent = image.parentNode,
            replacedImage;

        if (this.cache[src]) {
            replacedImage = this.cache[src].cloneNode(false);
            replacedImage.width = image.getAttribute('width');
            parent.replaceChild(replacedImage, image);
            this.announce('imagerjs.imageUpdated', {image: replacedImage, newsrc: src});
        } else {
            if (!this.preload) {
                replacedImage = image.cloneNode(false);
                replacedImage.src = src;
                this.cache[src] = replacedImage;
                parent.replaceChild(replacedImage, image);
                this.announce('imagerjs.imageUpdated', {image: replacedImage, newsrc: src});
            } else {
                replacedImage = image.cloneNode(false);
                var self = this;
                var imageCache = new Image();
                // .onload MUST be defined BEFORE setting src otherwise
                // it won't be triggered if the image is already cached
                // http://fragged.org/preloading-images-using-javascript-the-right-way-and-without-frameworks_744.html
                imageCache.onload = function() {
                    //IE6/7 Anim GIF protection: https://gist.github.com/eikes/3925183/#comment-851675
                    this.onload = this.onabort = this.onerror = null;
                    replacedImage.src = src;
                    self.cache[src] = replacedImage;
                    parent.replaceChild(replacedImage, image);
                    self.announce('imagerjs.imageUpdated', {image: replacedImage, newsrc: src});
                };
                imageCache.src = src;
            }
        }
    };

    Imager.prototype.determineAppropriateResolution = function (image) {
        var src           = image.getAttribute('data-src'),
            imagewidth    = image.clientWidth,
            selectedWidth = this.availableWidths[0],
            i             = this.availableWidths.length;

        while (i--) {
            if (imagewidth <= this.availableWidths[i]) {
                selectedWidth = this.availableWidths[i];
            }
        }

        return this.changeImageSrcToUseNewImageDimensions(src, selectedWidth);
    };

    Imager.prototype.changeImageSrcToUseNewImageDimensions = function (src, selectedWidth) {
        var self = this;
        return src.replace(this.regex, function (match, mode, width, height, crop, bg, path, offset, whole) {
            if (self.retina && self.isRetina) {
                selectedWidth *= 2;
            }
            switch (mode) {
                case "0":
                    return '/image/0/' + path;
                    break;
                case "1":
                case "4":
                    return '/image/' + mode + '/' + selectedWidth + '/0/' + path;
                    break;
                case "2":
                case "3":
                    var newHeight = Math.ceil((selectedWidth / width) * parseInt(height, 10));
                    var newsrc = '/image/' + mode + '/' + selectedWidth + '/' + newHeight + '/' + crop + '/';
                    if (bg !== undefined) {
                        newsrc += bg + '/';
                    }
                    return newsrc + path;
                    break;
            }
        });
    };

    Imager.prototype.determineIfRetina = function() {
        var isRetina = ( window.devicePixelRatio > 1.5 || (window.matchMedia && window.matchMedia("(-webkit-min-device-pixel-ratio: 1.5),(min--moz-device-pixel-ratio: 1.5),(-o-min-device-pixel-ratio: 3/2),(min-device-pixel-ratio: 1.5),(min-resolution: 114dpi),(min-resolution: 1.5dppx)").matches));
        if (this.events && this.eventsRetina) {
            this.announce('imagerjs.retinaStatus', {status: isRetina});
        }
        return isRetina;
    };

    Imager.prototype.debouncer = function (func, threshold, execAsap) {
        var timeout;
        return function debounced () {
            var obj = this, args = arguments;
            function delayed () {
                if (!execAsap)
                    func.apply(obj, args);
                timeout = null;
            };
            if (timeout) {
                clearTimeout(timeout);
            } else if (execAsap) {
                func.apply(obj, args);
            }
            timeout = setTimeout(delayed, threshold || 100);
        };
    };

    Imager.prototype.announce = function(name, detail) {
        if (this.events && window.CustomEvent) {
            var event = new CustomEvent(name, {detail: detail, bubbles: this.eventsBubble, cancelable: this.eventsCancelable});
            window.dispatchEvent(event);
        }
    };

}(window, document));

// IE 9/10 CustomEvent Polyfill
(function () {
    if (window.CustomEvent) {
        function CustomEvent ( event, params ) {
            params = params || { bubbles: false, cancelable: false, detail: undefined };
            var evt = document.createEvent( 'CustomEvent' );
            evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
            return evt;
        };

        CustomEvent.prototype = window.CustomEvent.prototype;

        window.CustomEvent = CustomEvent;
    }
})();
