"use strict";

function ChromiumController(fingerprinterClass) {
    AbstractController.call(this, fingerprinterClass);
    this.browser = "Chrome";
}

inherits(ChromiumController, AbstractController);

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

ChromiumController.prototype._sendFlashFingerprint = function(fingerprintId) {
    var iframe = document.querySelector("iframe");

    if (! iframe) {
        iframe = document.createElement("iframe");
        document.body.appendChild(iframe);
    }

    iframe.src = this.flashFingerprinterUrl + "?" + fingerprintId;
};
