"use strict";

/**
 * Firefox fingerprinter.
 */
function FirefoxFingerprinter () {
    AbstractFingerprinter.apply(this);
}

inherits(FirefoxFingerprinter, AbstractFingerprinter);

/**
 * Sets the list of fonts to this.fonts and calls the callback.
 * @param  {Function} callback The callback.
 */
FirefoxFingerprinter.prototype._getFonts = function(callback) {

    var i,
        enumerator = Components.classes["@mozilla.org/gfx/fontenumerator;1"]
            .getService(Components.interfaces.nsIFontEnumerator),
        fontNames = enumerator.EnumerateAllFonts({}),
        fonts = [];

    for (i = 0; i < fontNames.length; i += 1) {
        fonts.push(fontNames[i]);
    }

    this.fonts = fonts;

    if (callback) {
        callback();
    }
};
