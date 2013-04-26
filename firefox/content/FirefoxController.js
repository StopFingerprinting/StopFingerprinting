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
    this.statsUrl = this.prefManager.getCharPref("statsUrl");

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

FirefoxController.prototype._initMsgListener = function() {
    var self = this;
    document.addEventListener(
        "stopfingerprinting/msgtoextension",
        function (event) {
            var msg = JSON.parse(event.detail),
                response;

            if (msg.action === "LOG") {
                self.log(msg.msg);
            } else if (msg.action === "GET_STATS_URL") {
                response = {
                    action: "GET_STATS_URL",
                    url: self.statsUrl + "?id=" + self.browserId
                };
            } else if (msg.action === "TEST_FP") {
                self._uploadFingerprint(
                    function javascriptFpCallback (success) {
                        var resnponseEvent = new CustomEvent(
                            "stopfingerprinting/msgfromextension",
                            {
                                bubbles:true,
                                cancelable:false,
                                detail: JSON.stringify({
                                    action: "TEST_JS_FP",
                                    success: success
                                })
                            }
                        );

                        event.target.dispatchEvent(resnponseEvent);
                    },
                    function flashFpCallback (success) {
                        var resnponseEvent = new CustomEvent(
                            "stopfingerprinting/msgfromextension",
                            {
                                bubbles:true,
                                cancelable:false,
                                detail: JSON.stringify({
                                    action: "TEST_FLASH_FP",
                                    success: success
                                })
                            }
                        );

                        event.target.dispatchEvent(resnponseEvent);
                    },
                    true
                );
            } else if (msg.action === "STORE_FLASH_FINGERPRINT") {
                if (self._flashFpCallback) {
                    self._flashFpCallback(true);
                    self._flashFpCallback = null;
                }
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

FirefoxController.prototype._showStatsNotification = function(callback) {

    var prefName = "statsNotificationShown",
        shown = this.prefManager.getIntPref(prefName);

    if (! shown) {
        setTimeout(function () {
            var notifyBox = gBrowser.getNotificationBox();

            notifyBox.appendNotification(
                "You can now watch stats of StopFingerprinting in the extension's preferences",
                "stopfingerprinting/notification-stats",
                "chrome://stopfingerprinting/content/common/icons/16.png",
                notifyBox.PRIORITY_INFO_HIGH,
                []
            );
        }, 1000);

        this.prefManager.setIntPref(prefName, 1);
    }


    if (callback) {
        callback();
    }
}