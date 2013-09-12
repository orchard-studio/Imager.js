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

        this.availableWidths = opts.availableWidths || [160,320,640,1440];
        this.selector        = opts.selector || '.imager';
        this.className       = '.' + (opts.className || 'image-replace').replace(/^\.+/, '.');
        this.regex           = opts.regex || /\/image\/1\/\d+\/0(.+)$/i;
        this.gif             = document.createElement('img');
        this.gif.src         = 'data:image/gif;base64,R0lGODlhEAAJAIAAAP///wAAACH5BAEAAAAALAAAAAAQAAkAAAIKhI+py+0Po5yUFQA7';
        this.gif.className   = this.className.replace(/^[#.]/, '');
        this.divs            = $(this.selector);
        this.cache           = {};
        this.retina          = opts.retina === false ? false : true;
        this.changeDivsToEmptyImages();

        window.requestAnimationFrame(function(){
            self.init();
        });
    };


    Imager.prototype.init = function () {
        var self = this;

        this.initialized = true;
        this.checkImagesNeedReplacing();

        window.addEventListener('resize', function(){
            self.checkImagesNeedReplacing();
        }, false);
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
        } else {
            replacedImage = image.cloneNode(false);
            replacedImage.src = src;
            this.cache[src] = replacedImage;
        }

        parent.replaceChild(replacedImage, image);
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
        return src.replace(this.regex, function (match, path, offset, complete) {
            if (self.retina && self.isRetina()) {
                selectedWidth *= 2;
            }
            return '/image/1/' + selectedWidth + '/0' + path;
        });
    };

    Imager.prototype.isRetina = function() {
        return ( window.devicePixelRatio > 1.5 || (window.matchMedia && window.matchMedia("(-webkit-min-device-pixel-ratio: 1.5),(min--moz-device-pixel-ratio: 1.5),(-o-min-device-pixel-ratio: 3/2),(min-device-pixel-ratio: 1.5),(min-resolution: 114dpi),(min-resolution: 1.5dppx)").matches));
    };

}(window, document));
