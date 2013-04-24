#!/usr/bin/env python2.7

import os
import re
import sys
import json
import zipfile
import filecmp
import urlparse

__dir__ = os.path.realpath(os.path.dirname(__file__))

SUBMIT_INTERVAL = 3600000
SUBMIT_URL = "https://stopfingerprinting.irisa.fr/fingerprint/submit"
FLASH_FINGERPRINTER_URL = "https://stopfingerprinting.irisa.fr/fingerprint/flash"
LOGS_URL = "https://stopfingerprinting.irisa.fr/fingerprint/upload-logs"

if len(sys.argv) not in (2, 3, 4, 5, 6):
    print "USAGE:"
    print "\tpython2 " + os.path.basename(sys.argv[0]) + \
        " version [submit_interval] [submit_url] [flash_fingerprinter_url]" + \
        " [LOGS_URL]"
    sys.exit(1)

if len(sys.argv) > 2:
    SUBMIT_INTERVAL = sys.argv[2]

if len(sys.argv) > 3:
    SUBMIT_URL = sys.argv[3]

if len(sys.argv) > 4:
    FLASH_FINGERPRINTER_URL = sys.argv[4]

if len(sys.argv) > 5:
    LOGS_URL = sys.argv[5]


def zipdir(path, zip):
    for root, dirs, files in os.walk(path, followlinks=True):
        for file in files:
            zip.write(os.path.join(root, file))


def checK_url_domains():
    submit = urlparse.urlparse(SUBMIT_URL)
    flash = urlparse.urlparse(FLASH_FINGERPRINTER_URL)
    logs = urlparse.urlparse(LOGS_URL)

    if submit.scheme != flash.scheme or \
        submit.scheme != flash.scheme or \
        submit.netloc != flash.netloc or \
        submit.hostname != flash.hostname or \
            submit.port != flash.port:

        return False

    if submit.scheme != logs.scheme or \
        submit.scheme != logs.scheme or \
        submit.netloc != logs.netloc or \
        submit.hostname != logs.hostname or \
            submit.port != logs.port:

        return False

    return True


def check_chrome_version(version):
    f = open(__dir__ + "/chrome/manifest.json")
    manifest = json.load(f)

    if manifest["version"] != version:
        return False

    return True


def check_chrome_settings_version(version):
    f = open(__dir__ + "/chrome/settings.json")
    settings = json.load(f)

    if settings["version"] != version:
        return False

    return True


def check_chrome_common_files():
    dircmp = filecmp.dircmp(
        __dir__ + "/common",
        __dir__ + "/chrome/common",
        [],
        []
    )

    if len(dircmp.diff_files) != 0 or len(dircmp.funny_files) != 0 or \
            len(dircmp.left_only) != 0 or len(dircmp.right_only) != 0 or \
            len(dircmp.common_funny) != 0:

        return False

    return True


def check_chrome_permissions():
    permission = urlparse.urljoin(SUBMIT_URL, "/") + "*"

    f = open(__dir__ + "/chrome/manifest.json")
    manifest = json.load(f)

    for perm in manifest["version"]:
        up = urlparse.urlparse(perm)
        if up.scheme != '' and perm != permission:
            return False

    return permission in manifest["permissions"]


def check_chrome_content_security_policy():
    domain = urlparse.urljoin(SUBMIT_URL, "/")[:-1]

    f = open(__dir__ + "/chrome/manifest.json")
    manifest = json.load(f)

    return manifest["content_security_policy"] == "script-src 'self' " + \
        domain + "; object-src 'self' " + domain


def check_chrome_submit_url():
    f = open(__dir__ + "/chrome/settings.json")
    settings = json.load(f)

    if settings["submitUrl"] != SUBMIT_URL:
        return False

    return True


def check_chrome_flash_fingerprinter_url():
    f = open(__dir__ + "/chrome/settings.json")
    settings = json.load(f)

    if settings["flashFingerprinterUrl"] != FLASH_FINGERPRINTER_URL:
        return False

    return True


def check_chrome_logs_url():
    f = open(__dir__ + "/chrome/settings.json")
    settings = json.load(f)

    if settings["logsUrl"] != LOGS_URL:
        return False

    return True


def check_chrome_submit_interval():
    f = open(__dir__ + "/chrome/settings.json")
    settings = json.load(f)

    if settings["submitInterval"] != SUBMIT_INTERVAL:
        return False

    return True


def check_chrome_flash_content_script():
    f = open(__dir__ + "/chrome/manifest.json")
    manifest = json.load(f)

    pattern = FLASH_FINGERPRINTER_URL.replace("https://", "*://")
    pattern = pattern.replace("http://", "*://")
    pattern = re.sub("\?.*$", "*", pattern)

    if pattern[-1] != "*":
        pattern += "*"

    return pattern == manifest["content_scripts"][0]["matches"][0]


def pack_chrome(version):
    zip = zipfile.ZipFile(
        'stopfingerprinting-chrome-' + version + '.zip', 'w'
    )
    os.chdir("chrome")
    zipdir('.', zip)
    zip.close()
    os.chdir(__dir__)


def check_firefox_version(version):
    f = open(__dir__ + "/firefox/install.rdf", "rt")
    return "<em:version>" + version + "</em:version>" in f.read()


def check_firefox_settings_version(version):
    f = open(__dir__ + "/firefox/defaults/preferences/defaults.js", "rt")
    definition = 'pref("extensions.stopfingerprinting.version", "' + \
        version + '");'
    return definition in f.read()


def check_firefox_submit_url():
    f = open(__dir__ + "/firefox/defaults/preferences/defaults.js", "rt")
    definition = 'pref("extensions.stopfingerprinting.submitUrl", "' + \
        SUBMIT_URL + '");'
    return definition in f.read()


def check_firefox_flash_fingerprinter_url():
    f = open(__dir__ + "/firefox/defaults/preferences/defaults.js", "rt")
    definition = 'pref("extensions.stopfingerprinting.' + \
        'flashFingerprinterUrl", "' + FLASH_FINGERPRINTER_URL + '");'
    return definition in f.read()


def check_firefox_submit_interval():
    f = open(__dir__ + "/firefox/defaults/preferences/defaults.js", "rt")
    definition = 'pref("extensions.stopfingerprinting.submitInterval", ' + \
        str(SUBMIT_INTERVAL) + ');'
    return definition in f.read()


def check_firefox_logs_url():
    f = open(__dir__ + "/firefox/defaults/preferences/defaults.js", "rt")
    definition = 'pref("extensions.stopfingerprinting.logsUrl", "' + \
        str(LOGS_URL) + '");'
    return definition in f.read()


def pack_firefox(version):
    zip = zipfile.ZipFile(
        'stopfingerprinting-firefox-' + version + '.xpi', 'w'
    )
    os.chdir("firefox")
    zipdir('.', zip)
    zip.close()
    os.chdir(__dir__)


def main(version):

    if not checK_url_domains():
        print "URL domains don't match"
        sys.exit(1)

    if not check_chrome_version(version):
        print "Chrome version doesn't match"
        sys.exit(1)

    if not check_chrome_settings_version(version):
        print "Chrome version from settings doesn't match"
        sys.exit(1)

    if not check_chrome_permissions():
        print "Chrome permissions don't match"
        sys.exit(1)

    if not check_chrome_content_security_policy():
        print "Chrome content security policy doesn't match"
        sys.exit(1)

    if not check_chrome_submit_interval():
        print "Chrome submit interval doesn't match"
        sys.exit(1)

    if not check_chrome_submit_url():
        print "Chrome submit url doesn't match"
        sys.exit(1)

    if not check_chrome_flash_fingerprinter_url():
        print "Chrome flash fingerprinter url doesn't match"
        sys.exit(1)

    if not check_chrome_logs_url():
        print "Chrome logs url doesn't match"
        sys.exit(1)

    if not check_chrome_flash_content_script():
        print "Chrome flash content script doesn't match"
        sys.exit(1)

    if not check_chrome_common_files():
        print "Chrome common files don't match"
        sys.exit(1)

    if not check_firefox_version(version):
        print "Firefox version doesn't match"
        sys.exit(1)

    if not check_firefox_settings_version(version):
        print "Firefox version from settings doesn't match"
        sys.exit(1)

    if not check_firefox_submit_interval():
        print "Firefox submit interval doesn't match"
        sys.exit(1)

    if not check_firefox_submit_url():
        print "Firefox submit url doesn't match"
        sys.exit(1)

    if not check_firefox_logs_url():
        print "Firefox logs url doesn't match"
        sys.exit(1)

    if not check_firefox_flash_fingerprinter_url():
        print "Firefox flash fingerprinter url doesn't match"
        sys.exit(1)

    pack_chrome(version)
    pack_firefox(version)

main(sys.argv[1])
