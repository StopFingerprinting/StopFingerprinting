"use strict";

function ChromiumFingerprinter () {
    AbstractFingerprinter.apply(this);
}

inherits(ChromiumFingerprinter, AbstractFingerprinter);

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
