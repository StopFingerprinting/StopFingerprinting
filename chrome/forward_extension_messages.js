var port = chrome.runtime.connect();

window.addEventListener("stopfingerprinting/msgtoextension", function (event) {
    port.postMessage(JSON.parse(event.detail));
}, false);

port.onMessage.addListener(function (msg) {
    port.postMessage({
    action: "LOG",
        msg: "Got message from extension: " + msg.action +
            (msg.action === "SEND_FLASH_FINGERPRINT" ? " - id: " + msg.id : "")
    });

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