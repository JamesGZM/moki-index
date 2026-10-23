# Moki Index

Moki 输入法的插件、输入方案、模型与键盘布局市场索引。线上入口为 [index.ailaogong.men](https://index.ailaogong.men/)，主应用源码为 [JamesGZM/Moki](https://github.com/JamesGZM/Moki)。

## 当前 Moki 插件

- 当前收录 **21 个插件**：主仓 19 个统一为 **`0.0.2`**，其中 AI 回复要求 **Moki `>=0.0.6`**，其余 18 个要求 **`>=0.0.5`**；本仓 OpenAI 兼容 OCR、TypeSafe 兼容 JEV 也升级为 **`0.0.2`**／最低宿主保持 `0.0.1`。[两项图标补充预发布](https://github.com/JamesGZM/moki-index/releases/tag/plugins-jev-ocr-icons-0.0.2-20261022)已公开，两个实际包及校验文件均已匿名核对，详情见[补充发布记录](docs/jev-ocr-icons-0.0.2.md)。
- [统一图标批次 0.0.2 预发布](https://github.com/JamesGZM/moki-index/releases/tag/plugins-icons-0.0.2-20261022) 保留原始附件；其中 AI 回复当前请使用[设置模式开关优化包](https://github.com/JamesGZM/moki-index/releases/tag/plugins-ai-reply-settings-0.0.2-20261023)（版本 `0.0.2`／最低宿主 `0.0.6`，见[本次发布记录](docs/ai-reply-settings-scheme-names-20261023.md)），其余 18 个沿用原包。各次预发布均附 `SHA256SUMS`；图标、原文编辑及同版本覆盖方式见[发布记录](docs/plugin-release-0.0.2.md)，设计基线见[图标规范 1.0](docs/plugin-icons.md)。App 保持 `0.0.6`／build 6，本次不发布 App。
- SDK 协议：`1.0.0`；命令：`mopm`；插件包后缀：`.mopk`。插件不使用 `versionCode`。
- [插件商店索引](plugins/v2/index.yaml) 的 `index_version: 2` 表示索引结构版本，与 SDK 版本分别管理。
- 下载包以各条目的地址为准，每个下载条目包含真实文件的 SHA256、字节数和展示大小。旧 [0.0.1 Release](https://github.com/JamesGZM/moki-index/releases/tag/plugins-moki-0.0.1)、[采集版 0.0.2](https://github.com/JamesGZM/moki-index/releases/tag/plugins-capture-0.0.2) 及 [TypeSafe 兼容 JEV 预发布](https://github.com/JamesGZM/moki-index/releases/tag/plugins-typesafe-jev-0.0.1) 附件继续保留。
- 其中 19 个插件源码位于主应用的 `plugins/`，TypeSafe 兼容 JEV 与 OpenAI 兼容 OCR 源码位于本仓 `plugins/`。

| ID | 插件 | 商店分类 | 版本 | 包大小 | 最低 App 版本 |
| --- | --- | --- | --- | --- | --- |
| `com.jxmfkj.ai.ime.plugin.ai_reply` | AI 智能回复 | tool | 0.0.2 | 20.8 KB | >=0.0.6 |
| `com.jxmfkj.ai.ime.plugin.ai_write` | AI 帮写 | tool | 0.0.2 | 5.2 KB | >=0.0.5 |
| `com.jxmfkj.ai.ime.plugin.ai_writing` | AI 写作 | tool | 0.0.2 | 9.2 KB | >=0.0.5 |
| `com.jxmfkj.ai.ime.plugin.funasr_asr` | 阿里百炼 FunAsr | speech | 0.0.2 | 7.0 KB | >=0.0.5 |
| `com.jxmfkj.ai.ime.plugin.kaomoji` | 颜文字表情包 | emoji | 0.0.2 | 6.7 KB | >=0.0.5 |
| `com.jxmfkj.ai.ime.plugin.knowledge.local` | 本地知识库 | context | 0.0.2 | 12.5 KB | >=0.0.5 |
| `com.jxmfkj.ai.ime.plugin.meme_bunny` | 恶搞兔表情包 | emoji | 0.0.2 | 67.8 KB | >=0.0.5 |
| `com.jxmfkj.ai.ime.plugin.ocr_clean` | OCR 清洗规则 | tool | 0.0.2 | 18.0 KB | >=0.0.5 |
| `com.jxmfkj.ai.ime.plugin.openai_ocr` | OpenAI 兼容 OCR | ocr | 0.0.2 | 6.1 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.quick_phrase` | 常用语 | tool | 0.0.2 | 4.3 KB | >=0.0.5 |
| `com.jxmfkj.ai.ime.plugin.qwen_translate` | 千问翻译 | tool | 0.0.2 | 6.7 KB | >=0.0.5 |
| `com.jxmfkj.ai.ime.plugin.s3_clipboard_sync` | S3 剪贴板同步 | clipboard_sync | 0.0.2 | 10.0 KB | >=0.0.5 |
| `com.jxmfkj.ai.ime.plugin.sessions` | 会话管理 | context | 0.0.2 | 17.7 KB | >=0.0.5 |
| `com.jxmfkj.ai.ime.plugin.tencent_asr` | 腾讯云实时语音识别 | speech | 0.0.2 | 7.9 KB | >=0.0.5 |
| `com.jxmfkj.ai.ime.plugin.typesafe_jev` | TypeSafe 兼容 JEV | jev | 0.0.2 | 6.1 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.typing_stats` | 输入统计 | tool | 0.0.2 | 5.6 KB | >=0.0.5 |
| `com.jxmfkj.ai.ime.plugin.ui_read` | 界面读取规则 | tool | 0.0.2 | 11.5 KB | >=0.0.5 |
| `com.jxmfkj.ai.ime.plugin.volc_asr` | 火山引擎流式语音识别 | speech | 0.0.2 | 6.3 KB | >=0.0.5 |
| `com.jxmfkj.ai.ime.plugin.webdav_backup` | WebDAV 云备份 | backup | 0.0.2 | 7.6 KB | >=0.0.5 |
| `com.jxmfkj.ai.ime.plugin.webdav_clipboard_sync` | WebDAV 剪贴板同步 | clipboard_sync | 0.0.2 | 7.2 KB | >=0.0.5 |
| `com.jxmfkj.ai.ime.plugin.ximed_sync` | ximed 剪贴板同步 | clipboard_sync | 0.0.2 | 5.8 KB | >=0.0.5 |

`pluginType: context` 在商店显示为“资料”，只用于分类；会话管理、本地知识库的 manifest 类型仍为 `tool`。`provides` 只在商店索引中保留接口 ID 与主版本，完整契约以包内 manifest 为准。

TypeSafe 兼容 JEV 使用新 ID，替换当前商店中的博查 JEV。接口地址、API Key 和模型均需重新填写，安装后重新选择；接口地址是完整 POST 地址，不会追加 `/v1/systemone`。详见[插件说明](plugins/typesafe-jev/README.md)。

## Debug 预装

主应用仅在 Debug 启动时自动安装以下 6 个插件，工具栏按钮默认全部隐藏，由用户自行添加：

| 插件 | 源码目录 |
| --- | --- |
| AI 智能回复 | `ai-reply` |
| 千问翻译 | `qwen-translate` |
| 会话管理 | `sessions` |
| 本地知识库 | `local-knowledge` |
| OCR 清洗规则 | `ocr-clean` |
| 界面读取规则 | `ui-read` |

AI 帮写、AI 写作、WebDAV 剪贴板同步及其他插件可从商店按需安装。正式版保持原有手动安装方式。

## 历史发布

- [AI 回复兼容声明修正前快照](archives/ai-reply-before-host-0.0.6.yaml)：原最低宿主 0.0.5 标注错误，当前已修正为 0.0.6；旧包仅供追溯。

- [旧采集版 0.0.2 四条目快照](archives/plugins-capture-0.0.2.yaml)：保留本批同版本修订之前的兼容要求、下载地址和校验值，不参与当前默认版本选择。

- [旧 SDK / .xipk 插件索引](plugins/v2/legacy-index.yaml)：保存版本重置前的 21 个条目与真实下载记录；旧 Release 继续保留。
- [旧版 Lua/DEX 插件索引](plugins/index.yaml)：8 个归档条目，源文件位于 `src/plugins/v1/`，保留原始 ID、作者和兼容要求。
- 当前商店安装入口使用 `plugins/v2/index.yaml` 中的 `.mopk`，历史索引不参与当前默认版本选择。

## 其他资源目录

资源自身的发布版本与宿主兼容要求分别管理。当前 12 个输入方案和 7 个布局的 `appVersion` 使用 **Moki `>=0.0.1`**，不再沿用原作者的 Xime 2.x／3.x 版本号；下载物、资源发布版本、作者、许可证与校验值保持原样。新资源应按实际需要填写最低 Moki 版本。模型的既有要求及归档插件不在本次迁移范围。

### Moki 默认方案

`builtin` 保留原条目 ID，替换为 Moki 自有的六类方案包：九宫格拼音（新安装默认）、全键盘拼音、手写键盘、笔画键盘、五笔键盘、双拼键盘。配套 App 随包内置手写模型；商店包排除 `*.custom.yaml` 用户配置模板，不携带模型。手写模型兼容要求同步改为 Moki `>=0.0.1`，文件与校验值保持。生成入口是主应用仓库的 `scripts/package-default-scheme.py`，从 App 资源清单派生商店清单；使用 `-market.zip` 附件，不使用包含配置模板的初版 zip。

[默认方案 0.0.1 名称同步包](https://github.com/JamesGZM/moki-index/releases/tag/schemes-moki-default-names-0.0.1-20261023) 与当前 App 名称／顺序一致，包版本保持不变。旧默认包记录见[修订前快照](archives/builtin-before-names-0.0.1.yaml)，旧附件继续保留。旧五笔包的版本／作者／下载记录见 [历史条目](archives/builtin-wubi.yaml)，不混入新默认方案的可选版本。

### 模型

| ID | 名称 | 作者 | 分类 | 大小 | App 兼容要求 |
| --- | --- | --- | --- | --- | --- |
| jev-laya-int8 | laya 多语言 int8 | JamesGZM | jev | 352.2 MB | >=2.5.0 |
| ochwpro | 手写模型 | kingzcheung | handwriting | 6.7 MB | >=0.0.1 |
| predictive-text-base | 智能联想模型 base 版本 | kingzcheung | prediction | 34.8 MB | >=2.6.0 |
| predictive-text-small | 智能联想模型 small 版本 | kingzcheung | prediction | 18.9 MB | >=2.3.0 |
| punctuation_int8 | 标点预测模型 int8 | kingzcheung | punctuation | 2.3 MB | >=2.3.0 |
| x-asr-480ms-zh-en-punct-int8 | X-ASR 中英文语音识别（带标点） | X-ASR Team | asr | 133.90MB | >=3.0.0-beta6 |
| zipformer-zh-int8 | 中文 Zipformer int8 | kaldi | asr | 132.63MB | >=2.3.0 |

### 输入方案

| ID | 名称 | 作者 | 类型 | App 兼容要求 |
| --- | --- | --- | --- | --- |
| builtin | 默认方案 | Moki（整合；保留上游作者） | built-in | >=0.0.1 |
| cangjie | 倉頡輸入法 | rime | remote | >=0.0.1 |
| luna_pinyin | 朙月拼音 | rime | remote | >=0.0.1 |
| quick | 速成輸入法 | rime | remote | >=0.0.1 |
| rime-frost | 白霜拼音 | gaboolic | remote | >=0.0.1 |
| rime-ice | 雾凇拼音 | iDvel | remote | >=0.0.1 |
| rime-wanxiang | 万象拼音标准版 | amzxyz | remote | >=0.0.1 |
| stroke | 笔画 | rime | remote | >=0.0.1 |
| wubi98 | 五笔98 | rime | remote | >=0.0.1 |
| wubixsj | 新世纪五笔 | 空山明月（Xime 适配：aizigao） | remote | >=0.0.1 |
| xqzm | 风入松郑码方案 | 风入松 | remote | >=0.0.1 |
| zhengma | 郑码方案 | chen32768 | remote | >=0.0.1 |

### 键盘布局

布局内容托管在作者仓库，本索引保存引用。历史布局包的文件名与声明保持原样；规范见 [LAYOUT_SPEC.md](LAYOUT_SPEC.md)。

| ID | 名称 | 作者 | App 兼容要求 |
| --- | --- | --- | --- |
| flypy | 小鹤双拼带韵母 | kingzcheung | >=0.0.1 |
| msdouble | 双拼布局（微软双拼） | kingzcheung | >=0.0.1 |
| no_bubble | 无气泡布局 | kingzcheung | >=0.0.1 |
| number_rows | 数字行 | kingzcheung | >=0.0.1 |
| wubi_compact | 五笔86紧凑布局 | kingzcheung | >=0.0.1 |
| xime_flypy_proxy | 小鹤双拼多功能配置 | tiengming | >=0.0.1 |
| xime_index_net | 扩展商店资源加速 | tiengming | >=0.0.1 |

## 目录结构

```text
index.yaml                    # 市场主索引
src/plugins/v2/*.yaml         # 当前 Moki 插件条目源码
src/plugins/v1/*.yaml         # 历史 Lua/DEX 条目
src/rimes|models|layouts/     # 其他资源条目源码
plugins/v2/index.yaml         # 当前插件商店索引（生成）
plugins/v2/legacy-index.yaml  # 旧 SDK 发布快照
plugins/index.yaml            # 历史 Lua/DEX 索引（生成）
plugins/typesafe-jev/         # TypeSafe 兼容 JEV 插件源码
plugins/openai-ocr/           # OpenAI 兼容 OCR 插件源码
scripts/                     # 索引生成、校验与静态预览
src/index.js                 # Cloudflare Worker
wrangler.toml                # 线上域名和回源配置
```

## 插件构建与发布

使用主仓构建的 `mopm`。在本仓可分别打包这里维护的两个插件：

```bash
mopm pack plugins/typesafe-jev --out dist/plugin-js --release-dir dist/plugin-release
mopm pack plugins/openai-ocr --out dist/plugin-js --release-dir dist/plugin-release
```

其余 19 个插件在主应用仓库运行 `mopm pack`。App／插件版本仅在用户明确要求时调整；改图、打包或同步索引不自动升级版本。发布顺序：先构建并验证包，再上传真实 Release 资产，核对下载后填 `src/plugins/v2/*.yaml` 的版本、兼容范围、接口与下载元数据，最后生成并推送索引。不要只改后缀或把旧包重新标成新版本。同版本内容修订必须使用独立 Release tag／URL，保留旧附件并归档旧条目；不能用两个不同内容的包充当镜像。已安装旧 `0.0.2` 的用户需手动导入本批包覆盖，商店不会仅因内容变化显示版本更新。

```bash
uv run python scripts/test_provides.py
uv run python scripts/test_resource_versions.py
uv run python scripts/test_typesafe_jev.py
node --experimental-vm-modules plugins/typesafe-jev/main.test.mjs
uv run python scripts/ci-update.py
# 检查源条目是否缺失校验值（历史资源可能仍有缺项）
uv run python scripts/ci-update.py --check
# 可选：组装 dist/ 静态预览；线上实际使用 Worker
uv run python scripts/build_dist.py
```

详细上架格式见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 线上服务

[线上索引](https://index.ailaogong.men/) 由 Cloudflare Worker 代理本仓 `main` 分支的 YAML，根路径返回 `index.yaml`，响应缓存为 600 秒。索引推送后随 GitHub raw 更新；修改 Worker 源码或 `wrangler.toml` 时由 [部署工作流](.github/workflows/deploy.yml) 发布。

现有 Cloudflare 服务标识 `xime-index` 保留，以继续更新同一个 Worker 与域名；公开仓库与产品品牌为 `moki-index` / Moki。

## 许可

[CC BY-NC-SA 4.0](LICENSE) — 署名-非商业性使用-相同方式共享。上游插件与资源保留各自许可证和作者署名。
