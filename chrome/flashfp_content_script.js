var port = chrome.runtime.connect();

window.addEventListener("stopfingerprinting/msgtoextension", function (event) {
    port.postMessage(JSON.parse(event.detail));
}, false);