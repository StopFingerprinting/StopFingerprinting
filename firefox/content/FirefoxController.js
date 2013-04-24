"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");

function FirefoxController(fingerprinterClass) {
    AbstractController.call(this, fingerprinterClass);
    this.browser = "Firefox";
    this.prefManager = Services.prefs
        .getBranch("extensions.stopfingerprinting.");
    this._initMsgListener();
}

inherits(FirefoxController, AbstractController);

FirefoxController.prototype._getSettings = function(callback) {

    this.submitUrl = this.prefManager.getCharPref("submitUrl");
    this.submitInterval = this.prefManager.getIntPref("submitInterval");
    this.flashFingerprinterUrl = this.prefManager
        .getCharPref("flashFingerprinterUrl");
    this.version = this.prefManager.getCharPref("version");
    this.logsEnabled = this.prefManager.getIntPref("logsEnabled");
    this.logsUrl = this.prefManager.getCharPref("logsUrl");
    this.reloadIframe = this.prefManager.getIntPref("reloadIframe");

    if (callback) {
        callback();
    }
};

FirefoxController.prototype._getBrowserId = function(callback) {

    var browserId;

    try {
        browserId = this.prefManager.getCharPref("browserId");
    } catch (Error) {
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

FirefoxController.prototype._createIframe = function() {
    var iframe = document.createElement("iframe"),
        self = this;
    iframe.setAttribute("id", "stopfingerprinting-frame");
    iframe.setAttribute("name", "stopfingerprinting-frame");
    iframe.setAttribute("type", "content");
    iframe.setAttribute("collapsed", "true");

    iframe.addEventListener("DOMContentLoaded", function () {
        self._iframeLoadedEvent();
    }, false);

    document.getElementById("main-window").appendChild(iframe);

    return iframe;
};

FirefoxController.prototype._sendMessageToIframe = function(msg) {
    var resnponseEvent = new CustomEvent(
        "stopfingerprinting/msgfromextension",
        {
            bubbles:true,
            cancelable:false,
            detail: JSON.stringify(msg)
        }
    );

    this._iframe.contentDocument.dispatchEvent(resnponseEvent);
};

FirefoxController.prototype._loadInitialCountDate = function(callback) {
    var date;

    try {
        var dateStr = this.prefManager.getCharPref("initialCountDate");
        date = new Date(Date.parse(dateStr));
    } catch (Error) {
        date = new Date();
        this.prefManager.setIntPref("initialCountDate", date.toJSON());
    }

    this._initialCountDate = date;

    if (callback) {
        callback();
    }
};

FirefoxController.prototype._loadFingerprintsCount = function(callback) {
    this._fingerprintsCount = this.prefManager.getIntPref("fingerprintsCount");

    if (callback) {
        callback();
    }
};

FirefoxController.prototype._increaseFingerprintsCount = function(callback) {
    this._fingerprintsCount += 1;
    this.prefManager.setIntPref("fingerprintsCount", this._fingerprintsCount);

    if (callback) {
        callback();
    }
};

FirefoxController.prototype._loadLastFingerprint = function(callback) {
    var fp = this.prefManager.getCharPref("lastFingerprint");

    if (fp) {
        this._lastFingerprint = fp;
    }

    if (callback) {
        callback();
    }
};

FirefoxController.prototype._storeLastFingerprint = function(fp, callback) {
    this.prefManager.setCharPref("lastFingerprint", fp);
    this._lastFingerprint = fp;

    if (callback) {
        callback();
    }
}

FirefoxController.prototype._initMsgListener = function() {
    var self = this;
    document.addEventListener(
        "stopfingerprinting/msgtoextension",
        function (event) {
            var msg = JSON.parse(event.detail),
                response;


            if (msg.action === "STORE_FLASH_FINGERPRINT") {
                self._addFlashDataToLastFingerprint(msg.data);

            } else if (msg.action === "GET_FINGERPRINTS_COUNT") {
                response = {
                    action: "GET_FINGERPRINTS_COUNT",
                    count: self._fingerprintsCount
                };
            } else if (msg.action === "GET_INITIAL_COUNT_DATE") {
                response = {
                    action: "GET_INITIAL_COUNT_DATE",
                    date: self._initialCountDate
                };
            } else if (msg.action === "GET_LAST_FINGERPRINT") {
                response = {
                    action: "GET_LAST_FINGERPRINT",
                    fp: self._lastFingerprint
                };
            } else if (msg.action === "LOG") {
                self.log(msg.msg);
            } else if (msg.action === "GET_BROWSER_ID") {
                response = {
                    action: "GET_BROWSER_ID",
                    id: self.browserId
                };
            }

            if (response) {
                var resnponseEvent = new CustomEvent(
                    "stopfingerprinting/msgfromextension",
                    {
                        bubbles:true,
                        cancelable:false,
                        detail: JSON.stringify(response)
                    }
                );

                event.target.dispatchEvent(resnponseEvent);
            }
        },
        false,
        true
    );
}

FirefoxController.prototype._reloadIframe = function() {
    this._iframe.contentDocument.location.href = this.flashFingerprinterUrl;
}