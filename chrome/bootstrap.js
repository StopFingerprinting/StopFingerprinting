"use strict";

window.addEventListener("load", function(event) {
    var controller = new ChromiumController(ChromiumFingerprinter);
    controller.run();
}, false);