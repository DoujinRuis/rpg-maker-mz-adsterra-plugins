/*:
 * @target MZ
 * @plugindesc Adsterraのポップアンダー広告を表示します（スイッチON時に1回だけ）@profitableratecpm
 * @author あなた
 *
 * @param ShowSwitchId
 * @text 表示スイッチ番号
 * @type number
 * @min 1
 * @default 2
 * @desc このスイッチがONになるとポップアンダー広告が1回だけ表示されます。
 *
 * @help
 * このプラグインは、RPGツクールMZのゲームでAdsterraのポップアンダー広告を
 * スイッチ制御により1回だけ挿入するものです。
 *
 * 使用方法：
 * 1. Adsterraのポップアンダー用スクリプトが内部に埋め込まれています。
 * 2. プラグインパラメータのスイッチをONにすると1度だけ広告が発動します。
 * 3. 以後は再度スイッチOFF→ONしない限り発動しません。
 */

(() => {
    "use strict";

    const pluginName = "AdsterraPopunder";
    const parameters = Object.assign(
        {},
        PluginManager.parameters(pluginName),
        PluginManager.parameters(`walletWork/webAdPlugin/${pluginName}`),
        PluginManager.parameters(`webAdPlugin/${pluginName}`)
    );
    const showSwitchId = Number(parameters["ShowSwitchId"] || 2);
    let lastSwitchState = false;
    let scriptInserted = false;

    const walletWorkUrl = path => {
        if (window.location.protocol === "file:") {
            return new URL(`../../walletWork/${path}`, window.location.href).href;
        }
        const basePath = window.location.pathname.startsWith("/test/")
            ? "/test/walletWork/"
            : "/walletWork/";
        return new URL(`${basePath}${path}`, window.location.origin).href;
    };

    const sendAdLog = async () => {
        try {
            const response = await fetch(walletWorkUrl("ads/ad_log.php"), {
                method: "POST",
                credentials: "include",
                body: new URLSearchParams({ event_type: "ad_popunder" })
            });
            if (!response.ok) {
                console.warn(`[${pluginName}] 広告ログの送信に失敗しました。`, response.status);
            }
        } catch (error) {
            console.warn(`[${pluginName}] 広告ログの送信中にエラーが発生しました。`, error);
        }
    };

    const insertPopunderScript = () => {
        if (scriptInserted) return;
        scriptInserted = true;

        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "https://pl26873575.effectivecpmnetwork.com/56/a1/58/56a1581a3bc6f39f7a3c712ac195ed51.js";
        script.addEventListener("load", () => {
            void sendAdLog();
        }, { once: true });
        script.addEventListener("error", () => {
            script.remove();
            scriptInserted = false;
        }, { once: true });
        document.body.appendChild(script);
    };

    const _SceneManager_updateMain = SceneManager.updateMain;
    SceneManager.updateMain = function() {
        _SceneManager_updateMain.call(this);

        if ($gameSwitches) {
            const currentState = $gameSwitches.value(showSwitchId);
            if (currentState && !lastSwitchState) {
                insertPopunderScript();
            }
            lastSwitchState = currentState;
        }
    };
})();

