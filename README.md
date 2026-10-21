# Moki Index

Moki 输入法的插件、输入方案、模型与键盘布局市场索引。线上入口为 [index.ailaogong.men](https://index.ailaogong.men/)，主应用源码为 [JamesGZM/Moki](https://github.com/JamesGZM/Moki)。

## 当前 Moki 插件

- 当前发布：**21 个插件，统一 `0.0.1`**，最低宿主 **Moki `0.0.1`**。
- SDK 协议：`1.0.0`；命令：`mopm`；插件包后缀：`.mopk`。插件不使用 `versionCode`。
- [插件商店索引](plugins/v2/index.yaml) 的 `index_version: 2` 表示索引结构版本，与 SDK 版本分别管理。
- 下载包以各条目的地址为准：既有包见 [Moki 插件 0.0.1 Release](https://github.com/JamesGZM/moki-index/releases/tag/plugins-moki-0.0.1)，新 JEV 包见 [TypeSafe 兼容 JEV 预发布](https://github.com/JamesGZM/moki-index/releases/tag/plugins-typesafe-jev-0.0.1)。每个下载条目包含真实文件的 SHA256、字节数和展示大小。
- 其中 19 个插件源码位于主应用的 `plugins/`，TypeSafe 兼容 JEV 与 OpenAI 兼容 OCR 源码位于本仓 `plugins/`。

| ID | 插件 | 商店分类 | 版本 | 包大小 | 最低 App 版本 |
| --- | --- | --- | --- | --- | --- |
| `com.jxmfkj.ai.ime.plugin.ai_reply` | AI 智能回复 | tool | 0.0.1 | 16.1 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.ai_write` | AI 帮写 | tool | 0.0.1 | 2.9 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.ai_writing` | AI 写作 | tool | 0.0.1 | 5.8 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.funasr_asr` | 阿里百炼 FunAsr | speech | 0.0.1 | 9.9 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.kaomoji` | 颜文字表情包 | emoji | 0.0.1 | 3.0 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.knowledge.local` | 本地知识库 | context | 0.0.1 | 10.2 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.meme_bunny` | 恶搞兔表情包 | emoji | 0.0.1 | 64.9 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.ocr_clean` | OCR 清洗规则 | tool | 0.0.1 | 12.7 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.openai_ocr` | OpenAI 兼容 OCR | ocr | 0.0.1 | 2.6 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.quick_phrase` | 常用语 | tool | 0.0.1 | 1.5 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.qwen_translate` | 千问翻译 | tool | 0.0.1 | 2.9 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.s3_clipboard_sync` | S3 剪贴板同步 | clipboard_sync | 0.0.1 | 6.9 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.sessions` | 会话管理 | context | 0.0.1 | 12.2 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.tencent_asr` | 腾讯云实时语音识别 | speech | 0.0.1 | 11.8 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.typesafe_jev` | TypeSafe 兼容 JEV | jev | 0.0.1 | 2.5 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.typing_stats` | 输入统计 | tool | 0.0.1 | 2.5 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.ui_read` | 界面读取规则 | tool | 0.0.1 | 3.3 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.volc_asr` | 火山引擎流式语音识别 | speech | 0.0.1 | 9.2 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.webdav_backup` | WebDAV 云备份 | backup | 0.0.1 | 3.7 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.webdav_clipboard_sync` | WebDAV 剪贴板同步 | clipboard_sync | 0.0.1 | 4.2 KB | >=0.0.1 |
| `com.jxmfkj.ai.ime.plugin.ximed_sync` | ximed 剪贴板同步 | clipboard_sync | 0.0.1 | 2.5 KB | >=0.0.1 |

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

- [旧 SDK / .xipk 插件索引](plugins/v2/legacy-index.yaml)：保存版本重置前的 21 个条目与真实下载记录；旧 Release 继续保留。
- [旧版 Lua/DEX 插件索引](plugins/index.yaml)：8 个归档条目，源文件位于 `src/plugins/v1/`，保留原始 ID、作者和兼容要求。
- 当前商店安装入口使用 `plugins/v2/index.yaml` 中的 `.mopk`，历史索引不参与当前默认版本选择。

## 其他资源目录

资源自身的发布版本与宿主兼容要求分别管理。当前 12 个输入方案和 7 个布局的 `appVersion` 使用 **Moki `>=0.0.1`**，不再沿用原作者的 Xime 2.x／3.x 版本号；下载物、资源发布版本、作者、许可证与校验值保持原样。新资源应按实际需要填写最低 Moki 版本。模型的既有要求及归档插件不在本次迁移范围。

### 模型

| ID | 名称 | 作者 | 分类 | 大小 | App 兼容要求 |
| --- | --- | --- | --- | --- | --- |
| jev-laya-int8 | laya 多语言 int8 | JamesGZM | jev | 352.2 MB | >=2.5.0 |
| ochwpro | 手写模型 | kingzcheung | handwriting | 6.7 MB | >=2.5.0 |
| predictive-text-base | 智能联想模型 base 版本 | kingzcheung | prediction | 34.8 MB | >=2.6.0 |
| predictive-text-small | 智能联想模型 small 版本 | kingzcheung | prediction | 18.9 MB | >=2.3.0 |
| punctuation_int8 | 标点预测模型 int8 | kingzcheung | punctuation | 2.3 MB | >=2.3.0 |
| x-asr-480ms-zh-en-punct-int8 | X-ASR 中英文语音识别（带标点） | X-ASR Team | asr | 133.90MB | >=3.0.0-beta6 |
| zipformer-zh-int8 | 中文 Zipformer int8 | kaldi | asr | 132.63MB | >=2.3.0 |

### 输入方案

| ID | 名称 | 作者 | 类型 | App 兼容要求 |
| --- | --- | --- | --- | --- |
| builtin | 默认方案 | 王永民 | built-in | >=0.0.1 |
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

其余 19 个插件在主应用仓库运行 `mopm pack`。发布顺序：先构建并验证包，再上传真实 Release 资产，核对下载后填 `src/plugins/v2/*.yaml` 的版本、兼容范围、接口与下载元数据，最后生成并推送索引。不要只改后缀或把旧包重新标成新版本。

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
