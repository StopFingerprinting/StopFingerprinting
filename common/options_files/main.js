function syntaxHighlightJson (json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function sendJsonMessageToExtension (msg) {
    var event = new CustomEvent(
        "stopfingerprinting/msgtoextension",
        {
            bubbles:true,
            cancelable:false,
            detail: msg
        }
    );

    window.dispatchEvent(event);
};

window.addEventListener("stopfingerprinting/msgfromextension", function (e) {
    var msg = JSON.parse(e.detail);

    if (msg.action === "GET_FINGERPRINTS_COUNT") {
        $("#fingerprintsCount").text(msg.count);
    } else if (msg.action === "GET_INITIAL_COUNT_DATE") {
        var date = new Date(Date.parse(msg.date));
        $("#initialCountDate").text(date.toDateString());
    } else if (msg.action === "GET_LAST_FINGERPRINT") {
        if (msg.fp) {
            $("code").html(syntaxHighlightJson(
                JSON.stringify(msg.fp, undefined, 4)
            ));
        } else {
            $("code").html("Sorry, this is not available at the moment.");
        }
    }

}, false);

$(document).ready(function () {
    sendJsonMessageToExtension(
        JSON.stringify({action:"GET_FINGERPRINTS_COUNT"})
    );

    sendJsonMessageToExtension(
        JSON.stringify({action:"GET_INITIAL_COUNT_DATE"})
    );

    sendJsonMessageToExtension(
        JSON.stringify({action:"GET_LAST_FINGERPRINT"})
    );
});
