# JEV／OCR 图标补充 0.0.2

2026-10-22。两个插件包已通过[独立预发布](https://github.com/JamesGZM/moki-index/releases/tag/plugins-jev-ocr-icons-0.0.2-20261022)公开，两个实际包和SHA256SUMS均已匿名下载，内容／大小／摘要与本批产物一致。该批次不覆盖任何旧附件，索引随本修订更新。

| 插件 | 版本 | PNG 主体 | 包字节数 | SHA256 |
| --- | --- | --- | --- | --- |
| TypeSafe 兼容 JEV | 0.0.2 | 判断菱形、分支结果 | 6248 | `44dce3f1afdd4831226ec5e004fa1e9a08eb2e7ea114fc0c365add51a23584ec` |
| OpenAI 兼容 OCR | 0.0.2 | 扫描角框、文字 A | 6242 | `7a011ebb60d036a67d1f683298a0ec9da9889f11c27b48b4d57f2ed2bafeb5a8` |

仅上述两个清单的版本由 0.0.1 升为 0.0.2，并声明 `icon-v1.png`／`iconThemed: true`。256×256 透明 PNG 沿用图标规范 1.0，母版位于 `docs/plugin-icons/`，包内 `resources/` 与商店公开副本逐字节一致。主仓其他 19 个插件及 App 版本不变；两项的业务脚本、协议、配置键和最低宿主 0.0.1 不变，新图标不引入运行时 API 依赖。

已发布到独立 tag `plugins-jev-ocr-icons-0.0.2-20261022`，附件为两个 `.mopk` 和 `SHA256SUMS`。源条目／生成索引已准备真实包的 SHA256 与字节数，并保留旧 0.0.1 下载记录。旧 Release、旧附件和其余 19 项条目保持。

验证使用本轮 `mopm pack` 的真实产物运行两套 Node 回归，另检查清单／源条目／生成索引、图片摘要路径及 PNG 与实际包一致。两个新包与SHA256SUMS的匿名下载验证已完成；图片地址在索引合入main后验证。App与插件的实际设备安装、视觉和业务验收分别记录在主项目，本地构建不代替真机验收。
