"use strict";

function ChromiumController(fingerprinterClass) {
    AbstractController.call(this, fingerprinterClass);
    this.browser = "Chrome";
    this._setupPort();
}

inherits(ChromiumController, AbstractController);

ChromiumController.prototype._createIframe = function(callback) {
    var iframe = document.createElement("iframe"),
        self = this;
    iframe.addEventListener("load", function () {
        self._iframeLoadedEvent();
    }, false);
    document.body.appendChild(iframe);
    return iframe;
};

ChromiumController.prototype._getSettings = function(callback) {

    var self = this,
        xhr = new XMLHttpRequest();
    xhr.open('GET', "settings.json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);

                self.submitUrl = response.submitUrl;
                self.submitInterval = response.submitInterval;
                self.flashFingerprinterUrl = response.flashFingerprinterUrl;
                self.version = response.version;
                self.logsEnabled = response.logsEnabled;
                self.logsUrl = response.logsUrl;
                self.reloadIframe = response.reloadIframe;
                self.statsUrl = response.statsUrl;

                if (callback) {
                    callback();
                }
            }
        }
    };

    xhr.send();
};

ChromiumController.prototype._getBrowserId = function(callback) {

    var self = this;

    chrome.storage.local.get("browserId", function (result) {

        //This is done because the browser id used to be an int.
        if (result.browserId && typeof result.browserId !== "number") {
            self.browserId = result.browserId;
        }

        if (callback) {
            callback();
        }
    });

};

ChromiumController.prototype._storeBrowserId = function(id, callback) {

    this.browserId = id;

    chrome.storage.local.set({'browserId': id}, function() {

        if (callback) {
            callback();
        }
    });

};

ChromiumController.prototype._setupPort = function() {
    var self = this;

    chrome.runtime.onConnect.addListener(function (port) {

        var iframeUrlRegexp = /^chrome-extension:\/\/.*?\/background\.html$/;
        if (iframeUrlRegexp.exec(port.sender.tab.url)) {
            self._iframePort = port;
        }

        port.onMessage.addListener(function (msg) {
            var response;

            if (msg.action === "STORE_FLASH_FINGERPRINT") {
                self._addFlashDataToLastFingerprint(msg.data);
            }

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
            } else if (msg.action === "GET_STATS_URL") {
                response = {
                    action: "GET_STATS_URL",
                    url: self.statsUrl + "?id=" + self.browserId
                };
            }

            if (response) {
                port.postMessage(response);
            }
        });
    });
}

ChromiumController.prototype._sendMessageToIframe = function(msg) {
    this._iframePort.postMessage(msg);
};

ChromiumController.prototype._loadInitialCountDate = function(callback) {
    var self = this;

    chrome.storage.local.get("initialCountDate", function (result) {
        if (! result.initialCountDate) {
            var initialCountDate = new Date();

            chrome.storage.local.set(
                {'initialCountDate': initialCountDate.toJSON()},
                function() {
                    self._initialCountDate = initialCountDate;
                    if (callback) {
                        callback();
                    }
                }
            );
        } else {
            self._initialCountDate = new Date(
                Date.parse(result.initialCountDate)
            );
            if (callback) {
                callback();
            }
        }
    });
};

ChromiumController.prototype._loadFingerprintsCount = function(callback) {
    var self = this;

    chrome.storage.local.get("fingerprintsCount", function (result) {
        if (! result.fingerprintsCount) {
            var fingerprintsCount = 0;

            chrome.storage.local.set(
                {'fingerprintsCount': fingerprintsCount},
                function() {
                    self._fingerprintsCount = fingerprintsCount;
                    if (callback) {
                        callback();
                    }
                }
            );
        } else {
            self._fingerprintsCount = result.fingerprintsCount;
            if (callback) {
                callback();
            }
        }
    });
};

ChromiumController.prototype._increaseFingerprintsCount = function(callback) {
    var self = this;

    chrome.storage.local.set(
        {'fingerprintsCount': self._fingerprintsCount + 1},
        function() {
            self._fingerprintsCount += 1;
            if (callback) {
                callback();
            }
        }
    );
};

ChromiumController.prototype._loadLastFingerprint = function(callback) {
    var self = this;

    chrome.storage.local.get("lastFingerprint", function (result) {
        if (result.lastFingerprint) {
            self._lastFingerprint = result.lastFingerprint;
        }

        if (callback) {
            callback();
        }
    });
};

ChromiumController.prototype._storeLastFingerprint = function(fp, callback) {
    var self = this;

    chrome.storage.local.set({'lastFingerprint': fp}, function() {
        self._lastFingerprint = fp;

        if (callback) {
            callback();
        }
    });
}

ChromiumController.prototype._reloadIframe = function() {
    this._iframe.src = this.flashFingerprinterUrl;
}
