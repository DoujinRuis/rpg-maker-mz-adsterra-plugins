/*:
 * @target MZ
 * @plugindesc AdsterraのSocial Bar広告を、スイッチがONになったときに1回起動します。
 * @author DoujinRuis
 *
 * @param ShowSwitchId
 * @text 起動スイッチ
 * @type switch
 * @default 1
 * @desc このスイッチがOFFからONになったとき、Social Bar広告を起動します。
 *
 * @help
 * AdsterraのSocial Bar広告をゲーム内で起動するRPGツクールMZ用プラグインです。
 *
 * プラグイン管理で「起動スイッチ」を指定してください。
 * 指定したスイッチをOFFからONにすると、広告が1回起動します。
 * プラグインコマンドは必要ありません。
 *
 * 広告はゲームを起動している間に1回だけ読み込みます。
 * スイッチをOFFにしても、起動済みの広告は停止しません。
 */

(() => {
    "use strict";

    const pluginName = "AdsterraSocialBar";
    const params = Object.assign(
        {},
        PluginManager.parameters(pluginName),
        PluginManager.parameters(`walletWork/webAdPlugin/${pluginName}`),
        PluginManager.parameters(`webAdPlugin/${pluginName}`)
    );
    const showSwitchId = Number(params["ShowSwitchId"] || 1);
    const scriptElementId = "adsterra-social-bar-script";
    let scriptInserted = Boolean(document.getElementById(scriptElementId));
    let previousSwitchState = false;

    function warn(...args) {
        console.warn(`[${pluginName}]`, ...args);
    }

    function walletWorkUrl(path) {
        if (window.location.protocol === "file:") {
            return new URL(`../../walletWork/${path}`, window.location.href).href;
        }
        const basePath = window.location.pathname.startsWith("/test/")
            ? "/test/walletWork/"
            : "/walletWork/";
        return new URL(`${basePath}${path}`, window.location.origin).href;
    }

    function insertAdsterraSocialBarScript() {
        if (scriptInserted) return;
        scriptInserted = true;

        const script = document.createElement("script");
        script.id = scriptElementId;
        script.type = "text/javascript";
        script.async = true;
        script.src = walletWorkUrl("ads/social_bar.php");
        script.addEventListener("load", () => {
            void sendAdLog();
        }, { once: true });
        script.addEventListener("error", () => {
            warn("広告スクリプトを読み込めませんでした。");
            script.remove();
            scriptInserted = false;
        }, { once: true });
        document.body.appendChild(script);
    }

    async function sendAdLog() {
        try {
            const response = await fetch(walletWorkUrl("ads/ad_log.php"), {
                method: "POST",
                credentials: "include",
                body: new URLSearchParams({
                    event_type: "ad_socialbar"
                })
            });
            if (!response.ok) warn("広告ログの送信に失敗しました。", response.status);
        } catch (error) {
            warn("広告ログの送信中にエラーが発生しました。", error);
        }
    }

    function checkSocialBarTrigger() {
        if (!window.$gameSwitches || showSwitchId <= 0) return;
        const currentSwitchState = $gameSwitches.value(showSwitchId);
        if (currentSwitchState && !previousSwitchState) {
            insertAdsterraSocialBarScript();
        }
        previousSwitchState = currentSwitchState;
    }

    const _SceneManager_updateMain = SceneManager.updateMain;
    SceneManager.updateMain = function() {
        _SceneManager_updateMain.call(this);
        checkSocialBarTrigger();
    };
})();

