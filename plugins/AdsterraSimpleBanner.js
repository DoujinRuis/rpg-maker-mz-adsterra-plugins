/*:
 * @target MZ
 * @plugindesc Adsterraのシンプルバナー広告を、スイッチONの間だけ表示します。
 * @author サラ
 *
 * @help
 * Adsterraのシンプルバナー広告をゲーム画面上に表示する
 * RPGツクールMZ用プラグインです。
 *
 * 指定したゲームスイッチがONの間だけ300x250の広告枠を表示します。
 * 座標は指定したゲーム変数から取得します。
 * DebugModeをONにすると、実広告の代わりに確認用の枠を表示します。
 *
 * 広告スクリプトは /walletWork/ads/ad_frame.php 内のiframeで読み込むため、
 * 外部スクリプトのエラーがゲーム本体へ影響しにくくなります。
 *
 * @param AdSettings
 * @text 広告表示設定
 * @type struct<AdConfig>
 * @desc デバッグ表示、座標変数、表示切替スイッチを設定します。
 */

/*~struct~AdConfig:
 *
 * @param DebugMode
 * @text デバッグモード
 * @type boolean
 * @on ON
 * @off OFF
 * @default false
 *
 * @param AdXVar
 * @text X座標の変数
 * @type variable
 * @default 0
 *
 * @param AdYVar
 * @text Y座標の変数
 * @type variable
 * @default 0
 *
 * @param ToggleSwitch
 * @text 表示切替スイッチ
 * @type switch
 * @default 0
 */

(() => {
    "use strict";

    console.info("[AdsterraSimpleBanner] script evaluated", window.location.href);
    window.__AdsterraSimpleBannerLoaded = {
        loadedAt: new Date().toISOString(),
        href: window.location.href
    };

    function pluginParameters() {
        return Object.assign(
            {},
            PluginManager.parameters("AdsterraSimpleBanner"),
            PluginManager.parameters("walletWork/webAdPlugin/AdsterraSimpleBanner"),
            PluginManager.parameters("webAdPlugin/AdsterraSimpleBanner")
        );
    }

    const params = pluginParameters();
    const adConfig = JSON.parse(params["AdSettings"] || "{}");
    const debugMode = String(adConfig["DebugMode"] || "false") === "true";
    const adXVar = Number(adConfig["AdXVar"] || 0);
    const adYVar = Number(adConfig["AdYVar"] || 0);
    const fallbackAdX = Number(adConfig["AdX"] || 0);
    const fallbackAdY = Number(adConfig["AdY"] || 0);
    const toggleSwitch = Number(adConfig["ToggleSwitch"] || 0);

    const adWidth = 300;
    const adHeight = 250;

    let adContainer = null;
    let lastSwitchState = null;
    const debugOverlayEnabled = new URLSearchParams(window.location.search).has("addebug")
        || window.localStorage.getItem("addebug") === "1";
    let debugOverlay = null;

    function log(...args) {
        console.log("[AdsterraSimpleBanner]", ...args);
    }

    function warn(...args) {
        console.warn("[AdsterraSimpleBanner]", ...args);
    }

    function error(...args) {
        console.error("[AdsterraSimpleBanner]", ...args);
        updateDebugOverlay(`ERROR: ${args.map(String).join(" ")}`);
    }

    function updateDebugOverlay(message) {
        if (!debugOverlayEnabled) {
            return;
        }

        if (!debugOverlay) {
            debugOverlay = document.createElement("pre");
            debugOverlay.id = "adsterra-debug-overlay";
            debugOverlay.style.position = "fixed";
            debugOverlay.style.left = "8px";
            debugOverlay.style.bottom = "8px";
            debugOverlay.style.zIndex = "999999";
            debugOverlay.style.maxWidth = "520px";
            debugOverlay.style.maxHeight = "180px";
            debugOverlay.style.overflow = "auto";
            debugOverlay.style.margin = "0";
            debugOverlay.style.padding = "8px";
            debugOverlay.style.background = "rgba(0, 0, 0, 0.82)";
            debugOverlay.style.color = "#00ff90";
            debugOverlay.style.font = "12px monospace";
            debugOverlay.style.whiteSpace = "pre-wrap";
            debugOverlay.style.pointerEvents = "none";
            document.body.appendChild(debugOverlay);
        }

        const now = new Date().toLocaleTimeString();
        debugOverlay.textContent = `[${now}] ${message}\n${debugOverlay.textContent}`.slice(0, 3000);
    }

    function walletWorkUrl(path) {
        if (window.location.protocol === "file:") {
            return new URL(`../../walletWork/${path}`, window.location.href).href;
        }

        const basePath = window.location.pathname.startsWith("/test/")
            ? "/test/walletWork/"
            : "/walletWork/";

        const url = new URL(`${basePath}${path}`, window.location.origin).href;
        log("walletWorkUrl", { path, basePath, url });
        return url;
    }

    log("plugin loaded", {
        href: window.location.href,
        debugMode,
        adXVar,
        adYVar,
        toggleSwitch,
        adWidth,
        adHeight
    });
    updateDebugOverlay(
        `plugin loaded\nswitch=${toggleSwitch} xVar=${adXVar} yVar=${adYVar} debug=${debugMode}`
    );

    function getAdX() {
        if (adXVar > 0 && window.$gameVariables) {
            const adX = Number($gameVariables.value(adXVar));
            if (Number.isFinite(adX)) {
                return adX;
            }
        }
        return Number.isFinite(fallbackAdX) ? fallbackAdX : 0;
    }

    function getAdY() {
        if (adYVar > 0 && window.$gameVariables) {
            const adY = Number($gameVariables.value(adYVar));
            if (Number.isFinite(adY)) {
                return adY;
            }
        }
        return Number.isFinite(fallbackAdY) ? fallbackAdY : 0;
    }

    function updateAdPosition() {
        if (!adContainer) {
            return;
        }

        adContainer.style.left = `${getAdX()}px`;
        adContainer.style.top = `${getAdY()}px`;

        if (debugMode) {
            adContainer.textContent = `DEBUG AD\nX:${getAdX()} Y:${getAdY()}`;
        }
    }

    function createAdElement() {
        if (adContainer) {
            return;
        }

        log("createAdElement", {
            debugMode,
            adWidth,
            adHeight,
            x: getAdX(),
            y: getAdY(),
            toggleSwitch
        });
        updateDebugOverlay(`createAdElement x=${getAdX()} y=${getAdY()} size=${adWidth}x${adHeight}`);

        adContainer = document.createElement("div");
        adContainer.id = "adContainer";
        adContainer.style.position = "absolute";
        adContainer.style.width = `${adWidth}px`;
        adContainer.style.height = `${adHeight}px`;
        adContainer.style.zIndex = "100";
        adContainer.style.outline = "1px solid rgba(255, 0, 0, 0.8)";

        if (debugMode) {
            setupDebugAd();
        } else {
            setupRealAd();
        }

        updateAdPosition();
        document.body.appendChild(adContainer);
    }

    function setupRealAd() {
        const frameUrl = new URL(walletWorkUrl("ads/ad_frame.php"));
        frameUrl.searchParams.set("width", String(adWidth));
        frameUrl.searchParams.set("height", String(adHeight));

        log("setupRealAd iframe", frameUrl.href);
        updateDebugOverlay(`iframe src\n${frameUrl.href}`);

        const iframe = document.createElement("iframe");
        iframe.title = "Advertisement";
        iframe.src = frameUrl.href;
        iframe.width = String(adWidth);
        iframe.height = String(adHeight);
        iframe.loading = "lazy";
        iframe.referrerPolicy = "no-referrer-when-downgrade";
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "0";
        iframe.style.display = "block";
        iframe.addEventListener("load", () => {
            log("iframe loaded", iframe.src);
            updateDebugOverlay(`iframe loaded\n${iframe.src}`);
            void sendAdLog();
        });
        iframe.addEventListener("error", () => {
            error("iframe failed", iframe.src);
        });
        adContainer.appendChild(iframe);
    }

    function setupDebugAd() {
        log("setupDebugAd");
        updateDebugOverlay("setupDebugAd");
        adContainer.style.border = "2px dashed red";
        adContainer.style.background = "rgba(255, 255, 255, 0.85)";
        adContainer.style.color = "red";
        adContainer.style.fontSize = "18px";
        adContainer.style.fontWeight = "bold";
        adContainer.style.display = "flex";
        adContainer.style.alignItems = "center";
        adContainer.style.justifyContent = "center";
        adContainer.style.textAlign = "center";
        adContainer.style.whiteSpace = "pre-line";
    }

    async function sendAdLog() {
        log("sendAdLog start");
        updateDebugOverlay("sendAdLog start");
        try {
            const url = walletWorkUrl("ads/ad_log.php");
            log("sendAdLog request", url);
            const res = await fetch(url, {
                method: "POST",
                credentials: "include",
                body: new URLSearchParams({
                    event_type: "ad_shown"
                })
            });

            if (!res.ok) {
                warn("ad_log.php returned status", res.status);
                return;
            }

            log("sendAdLog success", res.status);
            updateDebugOverlay(`sendAdLog success status=${res.status}`);
        } catch (e) {
            error("ad_log.php request failed", e);
        }
    }

    function removeAdElement() {
        if (adContainer && adContainer.parentNode) {
            log("removeAdElement");
            adContainer.parentNode.removeChild(adContainer);
            adContainer = null;
        }
    }

    function checkAdVisibility() {
        if (toggleSwitch > 0 && window.$gameSwitches) {
            const isVisible = $gameSwitches.value(toggleSwitch);
            if (isVisible !== lastSwitchState) {
                log("switch state changed", {
                    toggleSwitch,
                    isVisible,
                    x: getAdX(),
                    y: getAdY()
                });
                updateDebugOverlay(`switch ${toggleSwitch}=${isVisible} x=${getAdX()} y=${getAdY()}`);
                lastSwitchState = isVisible;
            }

            if (isVisible) {
                createAdElement();
                updateAdPosition();
            } else {
                removeAdElement();
            }
        } else if (lastSwitchState !== "unavailable") {
            warn("switch check unavailable", {
                toggleSwitch,
                hasGameSwitches: Boolean(window.$gameSwitches)
            });
            updateDebugOverlay(`switch unavailable ${toggleSwitch} hasGameSwitches=${Boolean(window.$gameSwitches)}`);
            lastSwitchState = "unavailable";
        }
    }

    const _SceneManager_updateMain = SceneManager.updateMain;
    SceneManager.updateMain = function() {
        _SceneManager_updateMain.call(this);
        checkAdVisibility();
    };
})();

