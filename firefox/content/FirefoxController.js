"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");

function FirefoxController(fingerprinterClass) {
    AbstractController.call(this, fingerprinterClass);
    this.browser = "Firefox";
    this.prefManager = Services.prefs
        .getBranch("extensions.stopfingerprinting.");
}

inherits(FirefoxController, AbstractController);

FirefoxController.prototype._getSettings = function(callback) {

    this.submitUrl = this.prefManager.getCharPref("submitUrl");
    this.submitInterval = this.prefManager.getIntPref("submitInterval");
    this.flashFingerprinterUrl = this.prefManager
        .getCharPref("flashFingerprinterUrl");
    this.version = this.prefManager.getCharPref("version");

    if (callback) {
        callback();
    }
};

FirefoxController.prototype._getBrowserId = function(callback) {

    var browserId;

    try {
        browserId = this.prefManager.getCharPref("browserId");
    } catch(Error) {
        //This is done because the browser id used to be an int.
        this.prefManager.clearUserPref("browserId");
    }

    if (browserId) {
        this.browserId = browserId;
    } else {
        this.browserId = null;
    }

    if (callback) {
        callback();
    }
};

FirefoxController.prototype._storeBrowserId = function(id, callback) {

    this.prefManager.setCharPref("browserId", id);

    if (callback) {
        callback();
    }
};

FirefoxController.prototype._sendFlashFingerprint = function(fingerprintId) {

    var frame = this._getIframe();
    frame.contentDocument.location.href = this.flashFingerprinterUrl + "?" +
        fingerprintId;
};


FirefoxController.prototype._getIframe = function() {

    if (! this.frame) {
        this.frame = document.createElement("iframe");
        this.frame.setAttribute("id", "stopfingerprinting-frame");
        this.frame.setAttribute("name", "stopfingerprinting-frame");
        this.frame.setAttribute("type", "content");
        this.frame.setAttribute("collapsed", "true");
        document.getElementById("main-window").appendChild(this.frame);

        this.frame.addEventListener("load", function (event) {
            var doc = event.originalTarget;

            if (doc.location.href == "about:blank" ||
                doc.defaultView.frameElement) {

                return;
            }
        }, true);
    }

    return this.frame;
};