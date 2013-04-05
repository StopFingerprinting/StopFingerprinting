"use strict";

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

AbstractFingerprinter.prototype._getFonts = function(callback) {
    throw new Error('Not implemented: this method must load the fonts' +
        'info and call the callback once ready.');
};

AbstractFingerprinter.prototype.getFingerprint = function(callback) {
    var self = this;

    this._getFonts(function () {
        callback(self);
    });
};
