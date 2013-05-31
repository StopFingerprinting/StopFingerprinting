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
    this._iframeLoaded = false;
    this._iframe = null;
    this._logs = [];
    this._iframeLoadedCallback = null;
    this._flashFpCallback = null;

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

        msg = this.browser + " - " + msg;

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



    this._confirmInstallationIfNecessary(function () {
        self._getSettings(function () {
            self._getBrowserId(function () {
                self._showStatsNotification(function () {
                    self.log("create iframe");
                    self._iframe = self._createIframe();

                    self._iframe.contentDocument.location.href =
                        self.flashFingerprinterUrl;

                    self._initLoop();
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

AbstractController.prototype._iframeLoadedEvent = function() {
    this._iframeLoaded = true;

    if (this._iframeLoadedCallback) {
        this._iframeLoadedCallback();
    }
}

AbstractController.prototype._initLoop = function() {
    this.log("initializing loop");
    this._uploadFingerprint();
};

AbstractController.prototype._uploadFingerprint = function(javascriptFpCallback,
    flashFpCallback, dontReloadIframe) {

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

                        if (javascriptFpCallback) {
                            javascriptFpCallback(true);
                        }

                        if (self._hasFlash(REQUIRED_FLASH_VERSION)) {
                            self.log("starting flash fingerprint delivery");
                            self._sendFlashFingerprint(
                                response.payload.fingerprintId,
                                flashFpCallback,
                                dontReloadIframe
                            );
                        } else {
                            if (flashFpCallback) {
                                flashFpCallback(false);
                            }
                        }

                    } catch (e) {
                        if (javascriptFpCallback) {
                            javascriptFpCallback(false);
                        }

                        self.log("Unknown error: " + e);
                        self._setInterval();
                    }
                } else {
                    if (javascriptFpCallback) {
                        javascriptFpCallback(false);
                    }

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

AbstractController.prototype._sendFlashFingerprint = function(fingerprintId,
    flashFpCallback, dontReloadIframe) {

    var self = this;

    function send () {
        setTimeout(function () {
            //This timeout is to give the iframe time to initialize the
            //messages handler.
            self.log("sending message to the iframe to deliver the flash fp");
            self._iframe.removeEventListener('load', send, false);

            self._sendMessageToIframe({
                action: "SEND_FLASH_FINGERPRINT",
                id: fingerprintId
            })

            self._iframeLoadedCallback = null;
            self._flashFpCallback  = flashFpCallback;
        }, 1000);
    }

    if (! this._iframeLoaded) {
        this._iframeLoadedCallback = send;
    } else {
        if (this.reloadIframe && (! dontReloadIframe)) {
            this._iframeLoaded = false;
            this._iframeLoadedCallback = send;
            this._reloadIframe();
        } else {
            send();
        }
    }
};

AbstractController.prototype._sendMessageToIframe = function(msg) {
    throw new Error("Not implemented: This method should send msg to the " +
        "iframe. Iframe onload already was already executed when this is " +
        "called");
};

AbstractController.prototype._createIframe = function(callback) {
    throw new Error("Not implemented: This method creates an iframe and " +
        "return it. This should set the onload callback of the iframe to " +
        "this._iframeLoadedEvent.");
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

AbstractController.prototype._reloadIframe = function () {
    throw new Error("Not implemented: This should reload the iframe.");
}

AbstractController.prototype._showStatsNotification = function (callback) {
    throw new Error("Not implemented: Shows the stats notification if not " +
        "already  shown and calls the callback.");
}

AbstractController.prototype._confirmInstallationMessage =
"StopFingerprintint: Confirm the installation\n" +
"\n" +
"The browser extension you are about to install only accesses user’s browser " +
"and operating system properties enlisted at this address: \n" +
"\n" +
"https://stopfingerprinting.inria.fr/faq/#fingerprints \n" +
"\n" +
"Consequently, it sends the collected data to a secure server at INRIA. This " +
"data will only be used for research purposes inside INRIA and will not be " +
"shared with anyone outside of INRIA.\n" +
"\n" +
"Ifyou agree to share your browser properties as described above, please " +
"press OK.\n";

AbstractController.prototype._installationCanceledMessage =
"StopFingerprintint: Installation aborted\n" +
"\n" +
"The extension is still intalled, but not data is being collected.\n" +
"To completly remove it follow these instructions:\n" +
"\n";

AbstractController.prototype._confirmInstallationIfNecessary = function(cb) {
    throw new Error("Not implemented: Displays a confirmation message to the " +
        "user. If he accepts the callback is called, if not another message " +
        "is shown. Meesages are properties _confirmInstallationMessage and " +
        "_installationCanceledMessage");
}
