"use strict";

var REQUIRED_FLASH_VERSION = 11;

function AbstractController(fingerprinterClass) {
    var self = this;

    this.fingerprinterClass = fingerprinterClass;
    this.browserId = null;
    this.submitUrl = null;
    this.submitInterval = null;
    this.interval = null;
    this.version = null;
    this.logsEnabled = true;
    this.logsUrl = null;
    this.reloadIframe = null;
    this._fingerprintsCount = null;
    this._lastFingerprint = null;
    this._initialCountDate = null;
    this._iframeLoaded = false;
    this._iframe = null;
    this._logs = [];

    window.setInterval(function () {
        if (self._logs.length && self.logsUrl) {

            var json = JSON.stringify(self._logs);
            self._logs = [];

            var xhr = new XMLHttpRequest();
            xhr.open('POST', self.logsUrl);
            xhr.setRequestHeader(
                "Content-type",
                "application/x-www-form-urlencoded"
            );

            var params = "logs=" + encodeURIComponent(json);
            xhr.send(params);
        }
    }, 10 * 1000);
}


AbstractController.prototype.log = function(msg) {
    if (this.logsEnabled) {
        msg = (new Date).toUTCString() + ": " + msg;

        if (this.version) {
            msg = this.version + " - " + msg;
        }

        if (this.browserId) {
            msg = this.browserId + " - " + msg;
        }

        this._logs.push(msg);
    }
}

AbstractController.prototype.run = function() {
    var self = this;

    this._getSettings(function () {
        self._getBrowserId(function () {
            self._loadInitialCountDate(function () {
                self._loadFingerprintsCount(function () {
                    self._loadLastFingerprint(function () {

                        self.log("create iframe");
                        self._iframe = self._createIframe();

                        self._iframe.addEventListener('load', function() {
                            self.log("iframe loaded");
                            self._iframeLoaded = true;
                        }, false);

                        self._iframe.src = self.flashFingerprinterUrl;

                        self._initLoop();
                    });
                });
            });
        });
    });

};

AbstractController.prototype.stop = function() {
    this.log("stopping");
    if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
    }
};

AbstractController.prototype._initLoop = function() {
    this.log("initializing loop");
    this._uploadFingerprint();
};

AbstractController.prototype._uploadFingerprint = function() {

    this.log("uploading fingerprint");
    var fingerprinter = new (this.fingerprinterClass)(),
        self = this;

    fingerprinter.getFingerprint(function (fingerprint) {
        self.log("got the fingerprint");
        var xhr = new XMLHttpRequest(),
            json,
            params;

        if (self.browserId) {
            fingerprint.browserId = self.browserId;
        }

        fingerprint.extensionInfo = {
            version: self.version,
            browser: self.browser,
            hasFlash: self._hasFlash(11)
        };

        json = JSON.stringify(fingerprint);
        params = "fingerprint=" + encodeURIComponent(json);

        xhr.open('POST', self.submitUrl);
        xhr.setRequestHeader(
            "Content-type",
            "application/x-www-form-urlencoded"
        );

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {

                self.log("fingerprint xhr return " + xhr.status);
                if (xhr.status === 200) {
                    try {
                        var response = JSON.parse(xhr.responseText),
                            browserId = response.payload.browserId,
                            fp = response.payload.fingerprint;

                        self.log("fingerprint xhr ok");

                        if (! self.browserId) {
                            self._storeBrowserId(browserId, function () {
                                self.log("storing new browserId");
                                self._setInterval();
                            });
                        } else {
                            self._setInterval();
                        }

                        self._storeLastFingerprint(fp, function () {
                            self._increaseFingerprintsCount();
                        });

                        if (self._hasFlash(REQUIRED_FLASH_VERSION)) {
                            self.log("starting flash fingerprint delivery");
                            self._sendFlashFingerprint(
                                response.payload.fingerprintId
                            );
                        }

                    } catch (e) {
                        self.log("fingerprint xhr invalid json");
                        self._setInterval();
                    }
                } else {
                    self._setInterval();
                }
            }
        };

        self.log("sending fingerprint xhr");
        xhr.send(params);
    });
};

AbstractController.prototype._setInterval = function() {
    var self = this;
    if (this.interval === null) {
        this.log("setting up the main interval");
        this.interval = setInterval(function () {
            self._uploadFingerprint();
        }, this.submitInterval);
    }
};

AbstractController.prototype._hasFlash = function(version) {
    version = String(version);

    if (version.indexOf(".") === -1) {
        version += ".";
    }

    var flashPlugin = navigator.plugins["Shockwave Flash"];

    if (! flashPlugin) {
        return false;
    }

    return (flashPlugin.description.indexOf(version) !== -1);
};

AbstractController.prototype._addFlashDataToLastFingerprint =
    function(flashData, callback) {

    if (! this._lastFingerprint) {
        throw new Error("Trying to add flash data to null fingerprint.");
    }

    this._lastFingerprint.flashFingerprint = flashData;
    this._storeLastFingerprint(this._lastFingerprint, callback);
}

AbstractController.prototype._sendFlashFingerprint = function(fingerprintId) {
    var self = this;

    function send () {
        self.log("sending message to the iframe to deliver the flash fp");
        self._iframe.removeEventListener('load', send, false);

        self._sendMessageToIframe({
            action: "SEND_FLASH_FINGERPRINT",
            id: fingerprintId
        })
    }

    if (this._iframeLoaded && this.reloadIframe) {
        this._iframeLoaded = false;
        self._iframe.src = self.flashFingerprinterUrl;
    }

    if (! this._iframeLoaded) {
        this._iframe.addEventListener('load', send, false);
    } else {
        send()
    }
};

AbstractController.prototype._sendMessageToIframe = function(msg) {
    throw new Error("Not implemented: This method should send msg to the " +
        "iframe. Iframe onload already was already executed when this is " +
        "called");
};

AbstractController.prototype._createIframe = function(callback) {
    throw new Error("Not implemented: This method creates an iframe and " +
        "return it");
};

AbstractController.prototype._getSettings = function(callback) {
    throw new Error("Not implemented: This method should set the " +
        "settings in the controller and then call the callback.");
};

AbstractController.prototype._getBrowserId = function(callback) {
    throw new Error("Not implemented: This method should set the " +
        "browserId in the controller and then call the callback. If no id " +
        "was present null must be set.");
};

AbstractController.prototype._storeBrowserId = function(id, callback) {
    throw new Error("Not implemented: This method should store the " +
        "browserId, set it in the controller, and then call the callback.");
};

AbstractController.prototype._loadInitialCountDate = function(callback) {
    throw new Error("Not implemented: This method should load the " +
        "initial date when we started counting the fingerprints sent. " +
        "If no date is present we set the current one.");
};

AbstractController.prototype._loadFingerprintsCount = function(callback) {
    throw new Error("Not implemented: This method should load the sent " +
        "fingeprrints count. If none is present it must store a 0 in the " +
        "browser and set this numner.");
};

AbstractController.prototype._increaseFingerprintsCount = function(callback) {
    throw new Error("Not implemented: This method should increase the sent " +
        "fingerprints count by one and store this number in the browser.");
};

AbstractController.prototype._loadLastFingerprint = function(callback) {
    throw new Error("Not implemented: This method should load the " +
        "last fingerprinting, set it in the controller and then call the " +
        "callback. If no fingerprint was present null must be set.");
};

AbstractController.prototype._storeLastFingerprint = function(fp, callback) {
    throw new Error("Not implemented: This method should store the " +
        "fingerprint, set it in the controller, and then call the callback." +
        "We only keep track of the last fingerprint locally.");
}
