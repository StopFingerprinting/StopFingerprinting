"use strict";

/**
 * Abstract Fingerprinter class. This should be inherited in every browser
 * extension to add some non-crossbrowser things.
 */
function AbstractFingerprinter() {
    this.navigator = {
        userAgent: navigator.userAgent,
        cookieEnabled: !!navigator.cookieEnabled,
        javaEnabled: (typeof navigator.javaEnabled === "function") ?
            navigator.javaEnabled() : !!navigator.javaEnabled,
        doNotTrack: !!navigator.doNotTrack,
        language: navigator.language,
        mimeTypes: this._getMimeTypes(),
        plugins: this._getPlugins()
    };

    this.screen = {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth
    };

    this.Math = {
        E: Math.E.toString(),
        LN10: Math.LN10.toString(),
        LN2: Math.LN2.toString(),
        LOG2E: Math.LOG2E.toString(),
        LOG10E: Math.LOG10E.toString(),
        PI: Math.PI.toString(),
        SQRT1_2: Math.SQRT1_2.toString(),
        SQRT2: Math.SQRT2.toString()
    };

    this.dateString = (new Date()).toString();
    this.fonts = null;
}

/**
 * Returns a list of mime types.
 * @return {[Object]} A list of mimetypes with their type, description and
 *                    suffixes
 */
AbstractFingerprinter.prototype._getMimeTypes = function() {
    var i,
        mimeTypes = [];

    for (i = 0; i < navigator.mimeTypes.length; i += 1) {
        mimeTypes.push({
            description: navigator.mimeTypes[i].description,
            type: navigator.mimeTypes[i].type,
            suffixes: navigator.mimeTypes[i].suffixes.split(",")
        });
    }

    return mimeTypes;
};

/**
 * Returns a list of plugins.
 * @return {[Object]} A list of plugins with their name, filname and description
 */
AbstractFingerprinter.prototype._getPlugins = function() {
    var i,
        plugins = [];

    for (i = 0; i < navigator.plugins.length; i += 1) {
        plugins.push({
            name: navigator.plugins[i].name,
            filename: navigator.plugins[i].filename,
            description: navigator.plugins[i].description
        });
    }

    return plugins;
};

/**
 * Sets the list of fonts to this.fonts and calls the callback.
 * @param  {Function} callback The callback.
 */
AbstractFingerprinter.prototype._getFonts = function(callback) {
    throw new Error('Not implemented: this method must load the fonts' +
        'info and call the callback once ready.');
};

/**
 * Fingerprints the browser and executes the callback passing the fingerprinter
 * as argument.
 * @param  {Function} callback The callback
 */
AbstractFingerprinter.prototype.getFingerprint = function(callback) {
    var self = this;

    this._getFonts(function () {
        callback(self);
    });
};
