# Imager.js - Symphony CMS JIT Support

 * This Fork Source: http://github.com/firegoby/Imager.js
 * This Fork Author: Chris Batchelor, [Firegoby Design](http://firegoby.com)

This fork of [BBC News' Imager.js](http://github.com/bbc-news/Imager.js) adds support for Symphony CMS' JIT Image Manipulation extension/service. It also adds optional Retina/Hi-DPI image support and an XSLT template for easily outputting the correct Imager.js HTML.

## Changes in this fork

1. Customised default regexp to match URLs of the JIT form: `/image/1/640/0/images/subfolder/example.jpg`
2. Customised `changeImageSrcToUseNewImageDimensions` function to return URLs of the JIT form: `/image/1/newwidth/0/images/subfolder/example.jpg`
3. Added `retina` configuration option (defaults to `true`) that when enabled serves up double width images when the client's current browser window is Retina/Hi-DPI (DPI > 1.5)
4. Customised default `availableWidths` to smaller array of `[160, 320, 640, 960, 1440]` as most Symphony CMS user's servers probably shouldn't be generating as many assets on the fly as the BBC's servers can handle ;)
5. Customised default `selector` of `delayed-image-load` to `imager`
6. Added a XSLT template `imager` to ease placement of image assets (see below)

## Retina Support

This fork takes a slightly different approach to Retina/Hi-DPI images than some other techniques, instead of checking to see whether a `@2x` version of an image exists and then replacing it if it does, this instead simply **blindly** generates a double width image from the original source image and serves that. Therefore this approach is only suitable for use when the master/original images are all in high enough resolution to supply your design's needs on Retina/Hi-DPI devices. For example, you're creating a photography portfolio, you would upload a single high-resolution 3000px+ master JPG into Symphony and then let JIT generate all the other versions on the fly as needed. So an example user on 15" Retina MacbookPro would get served a 2880px wide image to display on screen at 1440px.

In other words, upscaling a low-resolution image and serving it double sized is not going to magically make it 'hi-dpi', it's just going to *increase* your user's bandwidth load. This feature should thus only be used when you have access to Hi-DPI image content; if you don't, simply pass the `retina: false` option when calling Imager.js (e.g. `var imager = new Imager({retina: false});` and it will work exactly as the original Imager.js does.

## Imager XSLT Template - imager.xsl

The `imager` template takes two required params `image` and `width`. `image` is a standard Symphony file upload XML node and `width` is Imager.js' default placeholder width (see Imager.js docs). Also takes an optional third param `class` that allows overriding default `imager` CSS class.

### Example XSLT

    <xsl:call-template name="imager">
        <xsl:with-param name="image" select="file"/>
        <xsl:with-param name="width" select="640"/>
    </xsl:call-template>

### Example Output HTML

    <div class="imager" data-src="/image/1/640/0/images/example/file.jpg" data-width="640"></div>

Main/Original BBC Imager.js README below...

***

# Imager.js

 * Website: http://responsivenews.co.uk/
 * Source: http://github.com/bbc-news/Imager.js 
 
*Note: this project is not ready for production and is currently in development*
 
Imager.js is an alternative solution to the issue of how to handle responsive image loading, created by developers at BBC News.

## What is it?

An open-source port of the BBC News technique for handling the loading of images within a responsive code base.

## Requirements

You'll need a server-side image processing script which can return optimised images at specific dimensions that match parameters set within a RESTful URL design.

For the purpose of demonstration we're using the 3rd party service [Placehold.it](http://placehold.it/).

## Using Imager.js

See the `Demo` directory for full example and source files.

Wherever you need an image to appear add: `<div class="delayed-image-load" data-src="http://placehold.it/340" data-width="340"></div>` - where the `data-width` is the size of the image placeholder (where the actual image will eventually be loaded) and the `data-src` is the initial URL to be loaded. 

Then within your JavaScript, initialise a new instance of the Imager Enhancer library: `new ImageEnhancer();`

## Contributing

If you want to add functionality to this project, pull requests are welcome.

 * Create a branch based off master and do all of your changes with in it.
 * Make sure commits are as 'atomic' as possible (this way specific changes can be removed or cherry-picked more easily)
 * If you have to pause to add a 'and' anywhere in the title, it should be two pull requests.
 * Make commits of logical units and describe them properly
 * Check for unnecessary whitespace with git diff --check before committing.
 * If possible, submit tests to your patch / new feature so it can be tested easily.
 * Assure nothing is broken by running all the test
 * Please ensure that it complies with coding standards.

**Please raise any issues with this project as a GitHub issue.**

## Credits

 * [Mark McDonnell](http://twitter.com/integralist)
 * [Tom Maslen](http://twitter.com/tmaslen)
 * [Addy Osmani](http://twitter.com/addyosmani) 

## Background

This is an experiment in offering developers an interim solution to responsive images based on the [ImageEnhancer](https://gist.github.com/Integralist/6157139) concept researched and developed by the team at BBC News. 

At present, support for `srcset` and `PictureFill` are not widespread and the polyfills for these solutions also come with a number of drawbacks. 

[Mark McDonnell (@integralist)](http://twitter.com/Integralist) documented the process and rewrote the original code so it could be evolved and improved with the help of the open-source community.

The goal of this project is to automate the process with the help of the [Grunt](http://gruntjs.com/) JavaScript task runner (potentially via `grunt-responsive-images` for image generation based on a source directory).

Much of this work can be repurposed to work with a more standards-based approach once support improves in modern browsers.

For the purposes of maintaining a distinguishment between the ImageEnhancer concept built by BBC News and this project, we're calling it Imager.js

## Why not srcset/Picturefill polyfills

Having reviewed the polyfills for these implementations, the cons outweigh the pros at this point. You either take performance hits or have to deal with 2x image requests, which is counter-intuitive. I'd prefer to just use srcset on its own, but other than WebKit other browsers have yet to implement at this point.

## Grunt Responsive Image Demo

This demo requires the following commands to be run...

- `npm install` (all dependencies specified in package.json)
- `brew install imagemagick` (for other installations see [http://www.imagemagick.org/script/binary-releases.php](http://www.imagemagick.org/script/binary-releases.php))

Review the `Gruntfile.js` and update the custom sizes that you want to use (if no sizes are specified in the Gruntfile then 320, 640, 1024 are used)...

```js
options: {
    sizes: [
        {
            width: 320,
            height: 240
        },
        {
            name: 'large',
            width: 640
        },
        {
            name   : 'large',
            width  : 1024,
            suffix : '_x2',
            quality: 0.6
        }
    ]
}
```

...be aware the names of the files need to change within your HTML...

```html
<div class="delayed-image-load" data-src="Assets/Images/Generated/A-320.jpg" data-width="1024"></div>
<div class="delayed-image-load" data-src="Assets/Images/Generated/B-320.jpg" data-width="1024"></div>
<div class="delayed-image-load" data-src="Assets/Images/Generated/C-320.jpg" data-width="1024"></div>
```

You can then pass those image sizes through to Imager.js along with a regex for Imager to parse the information...

```js
var imager = new Imager({
    availableWidths: [320, 640, 1024]
});
```

For full details of the Grunt task options see the [grunt-responsive-images](https://github.com/andismith/grunt-responsive-images/) repo on GitHub.

## Licence

Imager.js is available to everyone under the terms of the Apache 2.0 open source licence. 
Take a look at the LICENSE file in the code.
