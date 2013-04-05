"use strict";

function AbstractController(fingerprinterClass) {
    var self = this;

    this.fingerprinterClass = fingerprinterClass;
    this.browserId = null;
    this.submitUrl = null;
    this.submitInterval = null;
    this.interval = null;
    this.version = null;
}

AbstractController.prototype.run = function() {
    var self = this;

    this._getSettings(function () {
        self._getBrowserId(function () {
            self._initLoop();
        });
    });
};

AbstractController.prototype.stop = function() {
    if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
    }
};

AbstractController.prototype._initLoop = function() {
    var self = this;

    this._uploadFingerprint();
};

AbstractController.prototype._uploadFingerprint = function() {

    var fingerprinter = new (this.fingerprinterClass)(),
        self = this;

    fingerprinter.getFingerprint(function (fingerprint) {
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

                if (xhr.status === 200) {
                    try {
                        var response = JSON.parse(xhr.responseText),
                            browserId = response.payload.browserId;

                        if (! self.browserId) {
                            self._storeBrowserId(browserId, function () {
                                self._setInterval();
                            });
                        } else {
                            self._setInterval();
                        }

                        if (self._hasFlash(11)) {
                            self._sendFlashFingerprint(
                                response.payload.fingerprintId
                            );
                        }

                    } catch (e) {
                        self._setInterval();
                    }
                } else {
                    self._setInterval();
                }
            }
        };

        xhr.send(params);
    });
};

AbstractController.prototype._setInterval = function() {
    var self = this;

    if (this.interval === null) {
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
