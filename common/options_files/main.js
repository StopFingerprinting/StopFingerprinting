var FEATURES = [
    "navigator.userAgent",
    "navigator.cookieEnabled",
    "navigator.javaEnabled",
    "navigator.doNotTrack",
    "navigator.language",
    "navigator.mimeTypes",
    "navigator.plugins",
    "screen.colorDepth",
    "screen.pixelDepth",
    "screen.width",
    "screen.height",
    "Math.E",
    "Math.LN10",
    "Math.LN2",
    "Math.LOG2E",
    "Math.LOG10E",
    "Math.PI",
    "Math.SQRT1_2",
    "Math.SQRT2",
    "fonts",
    "ip",
    "httpUserAgent",
    "headers",
    "flashFingerprint.hasVirtualKeyboard",
    "flashFingerprint.videoStages",
    "flashFingerprint.physicalKeyboardType",
    "flashFingerprint.microphones",
    "flashFingerprint.isLSOEnabled",
    "flashFingerprint.multiTouch",
    "flashFingerprint.fonts",
    "flashFingerprint.mouseCursor",
    "flashFingerprint.printJobIsSupported",
    "flashFingerprint.contextMenuIsSupported",
    "flashFingerprint.accessibilityEnabled",
    "flashFingerprint.context3DDriverInfo",
    "flashFingerprint.localeIdNames",
    "flashFingerprint.securityExactSettings",
    "flashFingerprint.cameras",
    "flashFingerprint.drmIsSupported",
    "flashFingerprint.accelerometerSupported",
    "flashFingerprint.ip",
    "flashFingerprint.httpUserAgent",
    "flashFingerprint.headers",
    "flashFingerprint.capabilities.version",
    "flashFingerprint.capabilities.screenColor",
    "flashFingerprint.capabilities.hasEmbeddedVideo",
    "flashFingerprint.capabilities.pixelAspectRatio",
    "flashFingerprint.capabilities.hasAudio",
    "flashFingerprint.capabilities.screenDPI",
    "flashFingerprint.capabilities.avHardwareDisable",
    "flashFingerprint.capabilities.screenResolutionX",
    "flashFingerprint.capabilities.hasAccessibility",
    "flashFingerprint.capabilities.screenResolutionY",
    "flashFingerprint.capabilities.hasAudioEncoder",
    "flashFingerprint.capabilities.touchscreenType",
    "flashFingerprint.capabilities.hasMP3",
    "flashFingerprint.capabilities.hasIME",
    "flashFingerprint.capabilities.hasPrinting",
    "flashFingerprint.capabilities.hasTLS",
    "flashFingerprint.capabilities.hasScreenBroadcast",
    "flashFingerprint.capabilities.maxLevelIDC",
    "flashFingerprint.capabilities.hasScreenPlayback",
    "flashFingerprint.capabilities.supports32BitProcesses",
    "flashFingerprint.capabilities.hasStreamingAudio",
    "flashFingerprint.capabilities.supports64BitProcesses",
    "flashFingerprint.capabilities.hasStreamingVideo",
    "flashFingerprint.capabilities.hasVideoEncoder",
    "flashFingerprint.capabilities.isDebugger",
    "flashFingerprint.capabilities.localFileReadDisable",
    "flashFingerprint.capabilities.language",
    "flashFingerprint.capabilities.manufacturer",
    "flashFingerprint.capabilities.os",
    "flashFingerprint.capabilities.cpuArchitecture"
];

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


function trTpl(values) {
    var strTpl = "<tr><td>%name%</td><td class='value-column'><span class='feature-value'><span>%current_value%</span></span><a class='more' title='Click to see the full value'>+</a></td><td class='bits-number current-bits'>%this_week%</td><td class='bits-number'>%last_week%</td></tr>";



    if ((values.this_week !== undefined) && (values.this_week !== null)) {
        var icon = "";

        if (values.last_week != null) {
            if (values.last_week > values.this_week) {
                icon = '<span class="difference down">&#8681;</span>';
            } else if (values.last_week < values.this_week) {
                icon = '<span class="difference up">&#8679;</span>';
            } else {
                icon = '<span class="difference equal">=</span>';
            }
        }

        values.this_week = "<span class='this_week_bits'>" + values.this_week.toFixed(2) + "</span>" + " " + icon;
    } else {
        values.this_week = "N/A";
        values.persons = "N/A";
    }

    if ((values.last_week !== undefined) && (values.last_week !== null)) {
        values.last_week = values.last_week.toFixed(2);
    } else {
        values.last_week = "N/A";
    }


    if (values.name.indexOf("flashFingerprint.") !== -1) {
        values.name = values.name.replace(
            "flashFingerprint.",
            ""
        );

        values.name += ' <img src="options_files/flash.png" class="flash-icon" title="Obtained with Flash">'
    }

    if (values.value !== undefined) {
        values.current_value = syntaxHighlightJson(
            JSON.stringify(values.value, null, 4)
        );
    } else {
        values.current_value = "N/A";
    }

    for (var name in values) {
        strTpl = strTpl.replace("%" + name + "%", values[name]);
    }

    return strTpl;
}

function gotStats(data) {
    var $tbody = $("#fingerprint-stats tbody"),
        $tr,
        name,
        i;

    if (data["status"] != "ok") {
        errorStats();
        return;
    }

    data = data["payload"];

    for (i = 0; i < FEATURES.length; i += 1) {
        name = FEATURES[i];
        if (data[name] !== undefined) {
            $tr = $(trTpl(
                {
                    name: name,
                    this_week: data[name].this_week,
                    last_week: data[name].last_week,
                    value: data[name].current_value,
                }
            ));
        } else {
            $tr = $(trTpl(
                {
                    name: name
                }
            ));
        }

        $tbody.append($tr);
    }

    $("#fploading").hide();
    $("#fingerprint-stats").fadeIn();

    if (data.global_stats_msg) {
        $("#global-stats-msg").text(data.global_stats_msg).fadeIn();
    }

    $("#fingerprint-stats tbody tr").each(function () {
        if ($(this).find(".feature-value > span").outerWidth() <= $(this).find(".feature-value").outerWidth()) {
            $(this).find(".more").hide();
        } else {
            var id = Date.now()|0;

            var $div = $("<div><pre><code></code></pre></div>");
            $div.find("code").html($(this).find(".feature-value > span").html());

            $(this).find(".more").qtip({
                suppress: false,
                content: {
                    text: $div
                },
                position: {
                    my: 'center',
                    at: 'center',
                    target: $(window)
                },
                show: {
                    event: 'click',
                    solo: true,
                    modal: true
                },
                hide: false,
                style: {
                    classes: "value-expanded"
                }
            })
            $
        }
    });
}

function errorStats() {
    $("#fploading").hide();
    $("#fingerprint-stats-error").show();
}


var TEST_FLASH_FP_TIME_LIMIT = 7000,
    testFlashFpTimeout;

window.addEventListener("stopfingerprinting/msgfromextension", function (e) {
    var msg = JSON.parse(e.detail);

    if (msg.action === "GET_STATS_URL") {
        var jqXhr = $.getJSON(msg.url);
        jqXhr.fail(errorStats);
        jqXhr.done(gotStats);
    } else if (msg.action === "TEST_JS_FP") {
        $("#fp-js-test-loading").hide();

        if (msg.success) {
            $("#fp-js-test-ok").show();
        } else {
            $("#fp-js-test-error").show();
            $("#fp-flash-test-loading").hide();
            $("#fp-flash-test-error").show();
            clearTimeout(testFlashFpTimeout);
            testFlashFpTimeout = 0;
        }
    } else if (msg.action === "TEST_FLASH_FP") {
        if (testFlashFpTimeout) {
            clearTimeout(testFlashFpTimeout);
            testFlashFpTimeout = 0;

            $("#fp-flash-test-loading").hide();

            if (msg.success) {
                $("#fp-flash-test-ok").show();
            } else {
                $("#fp-flash-test-error").show();
            }
        }
    }

}, false);



$(document).ready(function () {
    sendJsonMessageToExtension(
        JSON.stringify({action:"GET_STATS_URL"})
    );

    $("#fp-test a").click(function (event) {
        event.preventDefault();
        $("#fp-test-progress .loading").show();
        $("#fp-test-progress .loaded").hide();
        $("#fp-test-progress").show();
        sendJsonMessageToExtension(
            JSON.stringify({action:"TEST_FP"})
        );

        if (testFlashFpTimeout) {
            clearTimeout(testFlashFpTimeout);
            testFlashFpTimeout = 0;
        }

        testFlashFpTimeout = setTimeout(function () {
            testFlashFpTimeout = 0;
            $("#fp-flash-test-loading").hide();
            $("#fp-flash-test-ok").hide();
            $("#fp-flash-test-error").show();
        }, TEST_FLASH_FP_TIME_LIMIT);
    });
});
