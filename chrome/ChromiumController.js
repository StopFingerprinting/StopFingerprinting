"use strict";

function ChromiumController(fingerprinterClass) {
    AbstractController.call(this, fingerprinterClass);
    this.browser = "Chrome";
    this._iframePort = null;
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
                        port.postMessage({
                            action: "TEST_JS_FP",
                            success: success
                        });
                    },
                    function flashFpCallback (success) {
                        port.postMessage({
                            action: "TEST_FLASH_FP",
                            success: success
                        });
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
                port.postMessage(response);
            }
        });
    });
}

ChromiumController.prototype._sendMessageToIframe = function(msg) {
    this._iframePort.postMessage(msg);
};

ChromiumController.prototype._reloadIframe = function() {
    this._iframe.src = this.flashFingerprinterUrl;
}
