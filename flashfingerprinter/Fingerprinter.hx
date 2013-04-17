typedef CameraMode = {
    width:Int,
    height:Int,
    fps:Float
};

typedef MaxCameraModesDefinition = {
    apect_ratio_1_1:CameraMode,
    apect_ratio_4_3:CameraMode,
    apect_ratio_14_9:CameraMode,
    apect_ratio_16_9:CameraMode
};

typedef Camera = {
    name:String,
    bandwidth:Int,
    maxModes:MaxCameraModesDefinition
};

typedef MicrophoneEnhancedOptions = {
    echoPath:Int,
    isVoiceDetected:Int,
    mode:String,
    nonLinearProcessing:Bool
};

typedef Microphone = {
    activityLevel:Float,
    codec:String,
    enableVAD:Bool,
    encodeQuality:Int,
    enhancedOptions:MicrophoneEnhancedOptions,
    framesPerPacket:Int,
    gain:Float,
    name:String,
    noiseSuppressionLevel:Int,
    rate:Int,
    silenceLevel:Float,
    silenceTimeout:Float,
    useEchoSuppression:Bool
};

typedef Font = {
    name:String,
    style:String,
    type:String
}

typedef Multitouch = {
    inputMode:String,
    maxTouchPoints:Int,
    supportedGestures:Array<String>,
    supportsGestureEvents:Bool,
    supportsTouchEvents:Bool
};

typedef Capabilities = {
    avHardwareDisable:Bool,
    cpuArchitecture:String,
    hasAccessibility:Bool,
    hasAudio:Bool,
    hasAudioEncoder:Bool,
    hasEmbeddedVideo:Bool,
    hasIME:Bool,
    hasMP3:Bool,
    hasPrinting:Bool,
    hasScreenBroadcast:Bool,
    hasScreenPlayback:Bool,
    hasStreamingAudio:Bool,
    hasStreamingVideo:Bool,
    hasTLS:Bool,
    hasVideoEncoder:Bool,
    isDebugger:Bool,
    language:String,
    localFileReadDisable:Bool,
    manufacturer:String,
    maxLevelIDC:String,
    os:String,
    pixelAspectRatio:Float,
    screenColor:String,
    screenDPI:Float,
    screenResolutionX:Float,
    screenResolutionY:Float,
    serverString:String,
    supports32BitProcesses:Bool,
    supports64BitProcesses:Bool,
    touchscreenType:String,
    version:String
};

typedef VideoStage = {
    colorSpaces:Array<String>
};

typedef Fp = {
    accessibilityEnabled:Bool,
    context3DDriverInfo:String,
    localeIdNames:Array<String>,
    cameras:Array<Camera>,
    microphones:Array<Microphone>,
    drmIsSupported:Bool,
    printJobIsSupported:Bool,
    accelerometerSupported:Bool,
    securityExactSettings:Bool,
    hasVirtualKeyboard:Bool,
    physicalKeyboardType:String,
    contextMenuIsSupported:Bool,
    mouseCursor:String,
    fonts:Array<Font>,
    multiTouch: Multitouch,
    capabilities:Capabilities,
    videoStages:Array<VideoStage>,
    isLSOEnabled:Bool
};

class ExtInterface {

    private var fpId:String;
    private var submitionUrl:String;
    private var urlLoader:flash.net.URLLoader;

    public function new() {
    }

    public function sendFingerprint(fpId:String, submitionUrl:String) {
        var fingerprinter:Fingerprinter = new Fingerprinter();
        this.fpId = fpId;
        this.submitionUrl = submitionUrl;
        fingerprinter.getFingerprint(this.gotFingerprintCallback);
    }

    public function gotFingerprintCallback(fp:Fp) {
        this._sendFingerprint(fp);
    }

    public function completeEvent(event:flash.events.Event):Void {
        var response = haxe.Json.parse(this.urlLoader.data);
        flash.external.ExternalInterface.call(
            "sendJsonMessageToExtension",
            haxe.Json.stringify({
                action: "STORE_FLASH_FINGERPRINT",
                data: response.payload.flashFingerprint
            })
        );
    }

    private function _sendFingerprint(fp:Fp) {
        var request = new flash.net.URLRequest(this.submitionUrl);
        request.method = flash.net.URLRequestMethod.POST;
        var data = new flash.net.URLVariables();
        data.id = this.fpId;
        data.fingerprint = haxe.Json.stringify(fp);
        request.data = data;
        this.urlLoader = new flash.net.URLLoader();
        this.urlLoader.addEventListener(
            flash.events.Event.COMPLETE,
            completeEvent
        );
        this.urlLoader.load(request);
    }
}


class Fingerprinter {

    private var fp:Fp;
    private var theCallback:Fp->Void;
    private var async:Bool;

    static function main() {

        var extInterface:ExtInterface = new ExtInterface();

        flash.external.ExternalInterface.addCallback(
            "sendFingerprint",
            extInterface.sendFingerprint
        );
    }

    public function new() {
    }

    public function getFingerprint(theCallback: Fp->Void) {
        this.theCallback = theCallback;
        this.async = false;
        this.fp = {
            accessibilityEnabled: this.getAccessibilityEnabled(),
            context3DDriverInfo: this.getContext3DDriverInfo(),
            localeIdNames: this.getLocaleIdNames(),
            cameras: this.getCameras(),
            microphones: this.getMicrophones(),
            drmIsSupported: this.getDrmIsSupported(),
            printJobIsSupported: this.getPrintJobIsSupported(),
            accelerometerSupported: this.getAccelerometerSupported(),
            securityExactSettings: this.getSecurityExactSettings(),
            hasVirtualKeyboard: this.getHasVirtualKeyboard(),
            physicalKeyboardType: this.getPhysicalKeyboardType(),
            contextMenuIsSupported: this.getContextMenuIsSupported(),
            mouseCursor: this.getMouseCursor(),
            fonts: this.getFonts(),
            multiTouch: this.getMultiTouch(),
            capabilities: this.getCapabilities(),
            videoStages: this.getVideoStages(),
            isLSOEnabled: this.getIsLSOEnabled()
        };

        if (this.async == false) {
            this.theCallback(this.fp);
        }
    }

    private function getAccessibilityEnabled():Bool {
        return flash.accessibility.Accessibility.active;
    }

    private function getContext3DDriverInfo():String {

        if (flash.Lib.current.stage.stage3Ds.length > 0) {
            this.async = true;

            var stage3D = flash.Lib.current.stage.stage3Ds[0];

            stage3D.addEventListener(
                flash.events.Event.CONTEXT3D_CREATE,
                this.context3DCreated
            );

            stage3D.requestContext3D();
        }

        return "not-available";
    }

    public function context3DCreated(event) {
        var targetStage3D:flash.display.Stage3D = untyped event.target;
        this.fp.context3DDriverInfo = targetStage3D.context3D.driverInfo;
        this.theCallback(this.fp);
    }

    private function getLocaleIdNames():Array<String> {
        var locales = [];

        for (locale in
            flash.globalization.StringTools.getAvailableLocaleIDNames()) {

            locales.push(locale);
        }

        return locales;
    }

    private function getCameras():Array<Camera> {

        var cameras:Array<Camera> = [];

        for (i in 0...flash.media.Camera.names.length) {
            var cam = flash.media.Camera.getCamera(Std.string(i));
            cameras.push({
                name: flash.media.Camera.names[i],
                bandwidth: cam.bandwidth,
                maxModes: this.getMaxCameraModes(cam)
            });
        }

        return cameras;
    }

    private function getMaxCameraModes(camera:flash.media.Camera):
        MaxCameraModesDefinition {

        if (flash.system.Capabilities.os.indexOf("Linux") != -1) {
            //This doesn't work on Linux.
            return null;
        }

        //Trying to get max 1:1 mode
        camera.setMode(2048 * 4, 2048 * 4, 30);
        var width_1_1 = camera.width;
        var height_1_1 = camera.height;
        var fps_1_1 = camera.fps;

        //Trying to get max 4:3 mode
        camera.setMode(2048 * 4, 2048 * 3, 30);
        var width_4_3 = camera.width;
        var height_4_3 = camera.height;
        var fps_4_3 = camera.fps;

        //Trying to get max 14:9 mode
        camera.setMode(2048 * 14, 2048 * 9, 30);
        var width_14_9 = camera.width;
        var height_14_9 = camera.height;
        var fps_14_9 = camera.fps;

        //Trying to get max 16:9 mode
        camera.setMode(2048 * 16, 2048 * 9, 30);
        var width_16_9 = camera.width;
        var height_16_9 = camera.height;
        var fps_16_9 = camera.fps;

        return {
            apect_ratio_1_1: {
                width: width_1_1,
                height: height_1_1,
                fps: fps_1_1
            },
            apect_ratio_4_3: {
                width: width_4_3,
                height: height_4_3,
                fps: fps_4_3
            },
            apect_ratio_14_9: {
                width: width_14_9,
                height: height_14_9,
                fps: fps_14_9
            },
            apect_ratio_16_9: {
                width: width_16_9,
                height: height_16_9,
                fps: fps_16_9
            }
        };
    }

    private function getMicrophones():Array<Microphone> {

        var microphones:Array<Microphone> = [];

        for (i in 0...flash.media.Microphone.names.length) {
            var mic = flash.media.Microphone.getMicrophone(i);

            var enhancedOptions:{
                echoPath:Int,
                isVoiceDetected:Int,
                mode:String,
                nonLinearProcessing:Bool
            } = null;

            if (mic.enhancedOptions != null) {
                enhancedOptions = {
                    echoPath: mic.enhancedOptions.echoPath,
                    isVoiceDetected: mic.enhancedOptions.isVoiceDetected,
                    mode: untyped mic.enhancedOptions.mode,
                    nonLinearProcessing: mic.enhancedOptions.nonLinearProcessing
                };
            }


            microphones.push({
                activityLevel: mic.activityLevel,
                codec: untyped mic.codec,
                enableVAD: mic.enableVAD,
                encodeQuality: mic.encodeQuality,
                enhancedOptions: enhancedOptions,
                framesPerPacket: mic.framesPerPacket,
                gain: mic.gain,
                name: flash.media.Microphone.names[i],
                noiseSuppressionLevel: mic.noiseSuppressionLevel,
                rate: mic.rate,
                silenceLevel: mic.silenceLevel,
                silenceTimeout: mic.silenceLevel,
                useEchoSuppression: mic.useEchoSuppression
            });
        }

        return microphones;

    }

    private function getDrmIsSupported():Bool {
        return flash.net.drm.DRMManager.isSupported;
    }

    private function getPrintJobIsSupported():Bool {
        return flash.printing.PrintJob.isSupported;
    }

    private function getAccelerometerSupported():Bool {
        return flash.sensors.Accelerometer.isSupported;
    }

    private function getSecurityExactSettings():Bool {
        return flash.system.Security.exactSettings;
    }

    private function getHasVirtualKeyboard():Bool {
        return flash.ui.Keyboard.hasVirtualKeyboard;
    }

    private function getPhysicalKeyboardType():String {
        return untyped flash.ui.Keyboard.physicalKeyboardType;
    }

    private function getContextMenuIsSupported():Bool {
        return flash.ui.ContextMenu.isSupported;
    }

    private function getMouseCursor():String {
        return flash.ui.Mouse.cursor;
    }

    private function getFonts():Array<Font> {

        var fonts:Array<Font> = [];

        for (font in flash.text.Font.enumerateFonts(true)) {
            fonts.push({
                name: font.fontName,
                style: untyped font.fontStyle,
                type: untyped font.fontType
            });
        }

        return fonts;
    }

    private function getMultiTouch():Multitouch {

        var mt:Multitouch = {
            inputMode: untyped flash.ui.Multitouch.inputMode,
            maxTouchPoints: flash.ui.Multitouch.maxTouchPoints,
            supportedGestures: [],
            supportsGestureEvents: flash.ui.Multitouch.supportsGestureEvents,
            supportsTouchEvents: flash.ui.Multitouch.supportsTouchEvents,
        };

        if (flash.ui.Multitouch.supportedGestures != null) {
            for (g in flash.ui.Multitouch.supportedGestures) {
                mt.supportedGestures.push(g);
            }
        }

        return mt;
    }

    private function getCapabilities():Capabilities {

        return {
            avHardwareDisable: flash.system.Capabilities.avHardwareDisable,
            cpuArchitecture: flash.system.Capabilities.cpuArchitecture,
            hasAccessibility: flash.system.Capabilities.hasAccessibility,
            hasAudio: flash.system.Capabilities.hasAudio,
            hasAudioEncoder: flash.system.Capabilities.hasAudioEncoder,
            hasEmbeddedVideo: flash.system.Capabilities.hasEmbeddedVideo,
            hasIME: flash.system.Capabilities.hasIME,
            hasMP3: flash.system.Capabilities.hasMP3,
            hasPrinting: flash.system.Capabilities.hasPrinting,
            hasScreenBroadcast: flash.system.Capabilities.hasScreenBroadcast,
            hasScreenPlayback: flash.system.Capabilities.hasScreenPlayback,
            hasStreamingAudio: flash.system.Capabilities.hasStreamingAudio,
            hasStreamingVideo: flash.system.Capabilities.hasStreamingVideo,
            hasTLS: flash.system.Capabilities.hasTLS,
            hasVideoEncoder: flash.system.Capabilities.hasVideoEncoder,
            isDebugger: flash.system.Capabilities.isDebugger,
            language: flash.system.Capabilities.language,
            localFileReadDisable:
                flash.system.Capabilities.localFileReadDisable,
            manufacturer: flash.system.Capabilities.manufacturer,
            maxLevelIDC: flash.system.Capabilities.maxLevelIDC,
            os: flash.system.Capabilities.os,
            pixelAspectRatio: flash.system.Capabilities.pixelAspectRatio,
            screenColor: flash.system.Capabilities.screenColor,
            screenDPI: flash.system.Capabilities.screenDPI,
            screenResolutionX: flash.system.Capabilities.screenResolutionX,
            screenResolutionY: flash.system.Capabilities.screenResolutionY,
            serverString: flash.system.Capabilities.serverString,
            supports32BitProcesses:
                flash.system.Capabilities.supports32BitProcesses,
            supports64BitProcesses:
                flash.system.Capabilities.supports64BitProcesses,
            touchscreenType: untyped flash.system.Capabilities.touchscreenType,
            version: flash.system.Capabilities.version
        }

    }

    private function getVideoStages():Array<VideoStage> {
        var stages:Array<VideoStage> = [];


        for (sv in flash.Lib.current.stage.stageVideos) {
            var colorSpaces = [];

            for (cs in sv.colorSpaces) {
                colorSpaces.push(cs);
            }

            stages.push({
                colorSpaces: colorSpaces
            });
        }

        return stages;
    }

    private function getIsLSOEnabled():Bool {
        try {
            var lso = flash.net.SharedObject.getLocal("test");
            return true;
        } catch(e:flash.errors.Error) {
            //nothing
        }
        return false;
    }

}