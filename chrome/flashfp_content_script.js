var port = chrome.runtime.connect();

window.addEventListener("stopfingerprinting/msgtoextension", function (event) {
    port.postMessage(JSON.parse(event.detail));
}, false);

port.onMessage.addListener(function (msg) {
    var resnponseEvent = new CustomEvent(
        "stopfingerprinting/msgfromextension",
        {
            bubbles:true,
            cancelable:false,
            detail: JSON.stringify(msg)
        }
    );

    window.dispatchEvent(resnponseEvent);
});
