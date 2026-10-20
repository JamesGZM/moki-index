# Moki Index

Moki 输入法的插件、方案、模型与键盘布局市场索引。

## 目录结构

```
├── index.yaml                 # 市场主索引（引用子索引）
├── src/                       # 源文件（每个条目一个 YAML）
│   ├── rimes/                 #   输入方案源文件
│   ├── plugins/v1/            #   旧版插件源文件归档（Lua/DEX）
│   ├── plugins/v2/            #   v2 插件源文件（JS/QuickJS，宿主 >=3.0.0）
│   ├── models/                #   模型源文件
│   └── layouts/               #   键盘布局源文件（内容托管在作者仓库，仅存引用）
├── rimes/                     # 方案子索引（自动生成）
│   └── index.yaml
├── plugins/                   # 插件子索引（自动生成）
│   ├── index.yaml             #   旧版插件（Lua/DEX，兼容旧版 App；源在 src/plugins/v1/）
│   └── v2/
│       └── index.yaml         #   v2 插件（JS/QuickJS，宿主 >=3.0.0；源在 src/plugins/v2/）
├── models/                    # 模型子索引（自动生成）
│   └── index.yaml
├── layouts/                   # 键盘布局子索引（自动生成）
│   └── index.yaml
├── scripts/
│   ├── ci-update.py           #   CI 自动补全 sha256/size
│   ├── lib.py                 #   共享工具库
│   ├── build_dist.py          #   组装 Cloudflare Pages 发布目录 dist/
│   └── generate_index.py      #   旧版生成器（已弃用，请用 ci-update.py）
├── dist/                      # Pages 发布产物（build_dist.py 生成，不入库）
├── CONTRIBUTING.md            # 上架指南
├── LAYOUT_SPEC.md             # 键盘布局上架规范
└── .github/workflows/         # CI 校验
```

## 支持情况

### 模型 (Models)

| ID | 名称 | 作者 | 分类 | 大小 | 最低 App 版本 |
|---|---|---|---|---|---|
| `ochwpro` | 手写模型 | bikeand (Kor1 ) | handwriting | 6.7 MB | >=2.5.0 |
| `predictive-text-base` | 智能联想模型 base 版本 | bikeand (Kor1 ) | prediction | 34.8 MB | >=2.6.0 |
| `predictive-text-small` | 智能联想模型 small 版本 | bikeand (Kor1 ) | prediction | 18.9 MB | >=2.3.0 |
| `punctuation_int8` | 标点预测模型 int8 | bikeand (Kor1 ) | punctuation | 2.3 MB | >=2.3.0 |
| `zipformer-zh-int8` | 中文 Zipformer int8 | bikeand (Kor1 ) | asr | 132.6 MB | <2.6.0 |

### 插件 (Plugins，旧版 Lua/DEX)

| ID | 名称 | 作者 | 类型 | 大小 | 最低 App 版本 |
|---|---|---|---|---|---|
| `com.kingzcheung.xime.plugin.funasr_asr` | 阿里百炼 FunAsr | Xime | speech | 10.2 KB | >=2.6.0 |
| `com.kingzcheung.xime.plugin.kaomoji` | 颜文字表情包 | Xime | emoji | 3.22 KB | >=2.6.0 |
| `com.kingzcheung.xime.plugin.meme_bunny` | 恶搞兔表情包 | Xime | emoji | 65 KB | >=2.6.0 |
| `com.kingzcheung.xime.plugin.volc_asr` | 火山引擎流式语音识别 | Xime | speech | 10.6 KB | >=2.6.0 |
| `com.kingzcheung.xime.plugin.webdav_clipboard_sync` | WebDAV 剪贴板同步 | Xime | clipboard_sync | 4.52 KB | >=2.6.0 |
| `com.kingzcheung.xime.plugin.ximed_sync` | ximed 剪贴板同步 | Xime | clipboard_sync | 3.01 KB | >=2.6.0 |

### 插件 v2 (Plugins v2，JS/QuickJS，宿主 >=3.0.0)

新版插件系统（TypeScript/QuickJS，`.xipk` 内含 `manifest.json` + 编译产物 `main.js`）使用独立索引
`plugins/v2/index.yaml`（`index_version: 2`），源文件放在 `src/plugins/v2/`；旧版插件的源文件归档在
`src/plugins/v1/`，发布到旧版稳定 URL `plugins/index.yaml`。索引条目在旧扁平结构上追加了新插件系统的元数据
（`icon` / `activation` / `minHostVersion` / `platforms` / `capabilities` / `provides` / `network`），
旧版 App 继续读取 `plugins/index.yaml`，互不影响。`provides` 在生成索引时从插件 manifest 收成接口 `id` 与主版本。
商店分类 `pluginType: context` 显示为「资料」（知识库与会话配置），只用于商店，不代表 manifest 的 `type`。

| ID | 名称 | 类型 | 大小 | 最低 App 版本 |
|---|---|---|---|---|
| `com.jxmfkj.ai.ime.plugin.ai_reply` | AI 智能回复 | tool | 16.1 KB | >=3.3.17 |
| `com.jxmfkj.ai.ime.plugin.ai_write` | AI 帮写 | tool | 2.9 KB | >=3.3.17 |
| `com.jxmfkj.ai.ime.plugin.ai_writing` | AI 写作 | tool | 5.8 KB | >=3.3.15 |
| `com.jxmfkj.ai.ime.plugin.bocha_jev` | 博查 JEV | jev | 2.3 KB | >=3.0.0 |
| `com.jxmfkj.ai.ime.plugin.funasr_asr` | 阿里百炼 FunAsr | speech | 9.9 KB | >=3.3.0 |
| `com.jxmfkj.ai.ime.plugin.kaomoji` | 颜文字表情包 | emoji | 3.0 KB | >=3.3.0 |
| `com.jxmfkj.ai.ime.plugin.knowledge.local` | 本地知识库 | context | 10.2 KB | >=3.3.3 |
| `com.jxmfkj.ai.ime.plugin.meme_bunny` | 恶搞兔表情包 | emoji | 65.0 KB | >=3.3.0 |
| `com.jxmfkj.ai.ime.plugin.ocr_clean` | OCR 清洗规则 | tool | 12.7 KB | >=3.3.0 |
| `com.jxmfkj.ai.ime.plugin.openai_ocr` | OpenAI 兼容 OCR | ocr | 2.6 KB | >=3.2.0 |
| `com.jxmfkj.ai.ime.plugin.quick_phrase` | 常用语 | tool | 1.5 KB | >=3.3.0 |
| `com.jxmfkj.ai.ime.plugin.qwen_translate` | 千问翻译 | tool | 2.9 KB | >=3.3.17 |
| `com.jxmfkj.ai.ime.plugin.s3_clipboard_sync` | S3 剪贴板同步 | clipboard_sync | 6.9 KB | >=3.3.0 |
| `com.jxmfkj.ai.ime.plugin.sessions` | 会话管理 | context | 12.2 KB | >=3.3.12 |
| `com.jxmfkj.ai.ime.plugin.tencent_asr` | 腾讯云实时语音识别 | speech | 11.8 KB | >=3.3.0 |
| `com.jxmfkj.ai.ime.plugin.typing_stats` | 输入统计 | tool | 2.5 KB | >=3.3.0 |
| `com.jxmfkj.ai.ime.plugin.ui_read` | 界面读取规则 | tool | 3.3 KB | >=3.3.0 |
| `com.jxmfkj.ai.ime.plugin.volc_asr` | 火山引擎流式语音识别 | speech | 9.2 KB | >=3.3.0 |
| `com.jxmfkj.ai.ime.plugin.webdav_backup` | WebDAV 云备份 | backup | 3.7 KB | >=3.3.0 |
| `com.jxmfkj.ai.ime.plugin.webdav_clipboard_sync` | WebDAV 剪贴板同步 | clipboard_sync | 4.2 KB | >=3.3.0 |
| `com.jxmfkj.ai.ime.plugin.ximed_sync` | ximed 剪贴板同步 | clipboard_sync | 2.5 KB | >=3.3.0 |

### 输入方案 (Rimes)

| ID | 名称 | 作者 | 类型 | 标签 | 最低 App 版本 |
|---|---|---|---|---|---|
| `cangjie` | 倉頡輸入法 | rime | remote | 倉頡 | >=2.3.0 |
| `luna_pinyin` | 朙月拼音 | rime | remote | 拼音, 反查 | >=2.3.0 |
| `quick` | 速成輸入法 | rime | remote | 速成 | >=2.3.0 |
| `rime-ice` | 雾凇拼音 | iDvel | remote | 拼音, 双拼 | >=2.3.0 |
| `rime-wanxiang` | 万象拼音标准版 | amzxyz | remote | 拼音, 双拼 | >=2.4.0 |
| `stroke` | 笔画 | rime | remote | 笔画 | >=2.5.0 |
| `wubi86` | 五笔86 | rime | built-in | 五笔, 拼音 | >=2.3.0 |
| `wubi98` | 五笔98 | rime | remote | 五笔, 形码, 繁体 | >=2.3.0 |
| `zhengma` | 郑码方案 | chen32768 | remote | 郑码, 拼音, 简繁 | >=2.3.0 |

## 工作原理

CI 自动为每个下载链接补全 `sha256`、`size`（人类可读）和 `sizeBytes`（精确字节数），
方便 App 展示文件大小和计算下载进度。`version` 为 `master`/`main` 的分支引用会被跳过（内容不固定）。

## 键盘布局 (Layouts)

布局是「一套 `xime.custom.yaml` 键盘配置」，本索引只保存**引用**，
包与资源托管在作者自有仓库。详见 [LAYOUT_SPEC.md](LAYOUT_SPEC.md)。

| ID | 名称 | 作者 | 标签 | 最低 App 版本 |
|---|---|---|---|---|
| `number_rows` | 数字行 | kingzcheung | 布局 | >=3.0.0 |

## 本地更新

```bash
# 补全 sha256/size 并重新生成索引
python scripts/ci-update.py

# 仅检查是否有缺失
python scripts/ci-update.py --check

# 本地预览 Pages 发布内容（生成 dist/）
python scripts/build_dist.py
```

线上 `https://index.ailaogong.men/` 由 Cloudflare Worker 代理本仓 `main` 分支的 YAML。修改并推送索引后，内容会随 GitHub raw 更新；响应的缓存期限为 600 秒。修改 Worker 源码或 `wrangler.toml` 时，由 [部署工作流](.github/workflows/deploy.yml) 发布 Worker。

现有 Cloudflare Worker 的部署名称仍为 `xime-index`，用于更新同一个服务与自定义域名；GitHub 仓库及公开品牌为 `moki-index` / Moki。

Moki 新插件格式为 `.mopk`，CLI 为 `mopm`，SDK 为 `1.0.0`，最低宿主为 `0.0.1`。本仓已有版本记录仍对应真实发布的旧 `.xipk` 文件；新包上传前不改写其文件名、版本、校验值或兼容要求。

## 上架

见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可

[CC BY-NC-SA 4.0](LICENSE) — 署名-非商业性使用-相同方式共享

