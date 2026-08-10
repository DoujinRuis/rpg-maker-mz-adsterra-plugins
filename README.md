# RPG Maker MZ Adsterra Plugins

RPGツクールMZ向けのAdsterra広告プラグイン集です。RPG_DREAMERSのチュートリアルゲームで動作確認した最新版を管理します。

## 収録プラグイン

- `AdsterraSimpleBanner.js`: ゲームスイッチがONの間、300×250のシンプルバナーを表示
- `AdsterraSocialBar.js`: ゲームスイッチがONになった時にSocial Barを起動
- `AdsterraPopunder.js`: ゲームスイッチがONになった時にポップアンダーを起動

## 導入

1. `plugins/` 内の必要なファイルを、ゲームの `js/plugins/` または任意のサブディレクトリへコピーします。
2. RPGツクールMZのプラグイン管理で有効化します。
3. 各プラグインの表示用スイッチと座標変数を設定します。

現在のファイルは、RPG_DREAMERSの `/walletWork/` APIと広告枠に合わせた構成です。

- Simple Banner: `/walletWork/ads/ad_frame.php` と `ad_log.php`
- Social Bar: `/walletWork/ads/social_bar.php` と `ad_log.php`
- Popunder: プラグイン内に設定されたAdsterraスクリプトURLと `ad_log.php`

別サイトで利用する場合は、各APIの配置と広告枠設定を利用先に合わせてください。

## バージョン管理

安定版は `main` ブランチで管理し、公開版は `v1.0.0` のようなGitタグで固定します。変更内容は [CHANGELOG.md](CHANGELOG.md) に記録します。

## 動作確認

```powershell
npm run check
```

この確認では、3つのJavaScriptファイルに構文エラーがないことを検証します。
