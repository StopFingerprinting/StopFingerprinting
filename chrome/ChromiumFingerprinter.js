"use strict";

/**
 * Chromium fingerprinter.
 */
function ChromiumFingerprinter () {
    AbstractFingerprinter.apply(this);
}

inherits(ChromiumFingerprinter, AbstractFingerprinter);

/**
 * Sets the list of fonts to this.fonts and calls the callback.
 * @param  {Function} callback The callback.
 */
ChromiumFingerprinter.prototype._getFonts = function(callback) {
    var self = this;
    chrome.fontSettings.getFontList(function (fontNames) {
        var fonts = [],
            i;

        for (i = 0; i < fontNames.length; i += 1) {
            fonts.push(fontNames[i].displayName);
        }

        self.fonts = fonts;

        if (callback) {
            callback();
        }
    });

};
