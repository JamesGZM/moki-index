# AI 回复设置与默认方案名称 · 同版本发布

2026-10-23。本次发布两份独立预发布附件，切换当前索引入口，保留旧 Release 及校验记录；不发布 App。

| 内容 | 版本 | 最低宿主 | 文件字节数 | SHA256 |
| --- | --- | --- | --- | --- |
| [AI 回复设置模式切换优化 · 0.0.2](https://github.com/JamesGZM/moki-index/releases/tag/plugins-ai-reply-settings-0.0.2-20261023) | 0.0.2 | 0.0.6 | 21264 | `0a9b4e7841505e2005a38723e62290c61f6e46f758f7914e4298de04d43981bf` |
| [默认方案名称同步 · 0.0.1](https://github.com/JamesGZM/moki-index/releases/tag/schemes-moki-default-names-0.0.1-20261023) | 0.0.1 | 0.0.1 | 7685325 | `19ef229c9fe12c377e27a3208ef456d7af1096165ee431b4f64e1d1afa323216` |

AI 回复设置采用「自动读取」主题开关，与面板共用 `captureMode` 并即时保存；关闭后使用剪贴板文字或图片。切换不会触发采集或生成，原规则／通用读取缓存修复保留。源码为 Moki `bb993f7af84e0bab05461739acb482377b027cec`，已随 [PR60](https://github.com/JamesGZM/Moki/pull/60) 合并。沿用图标、宿主要求和旧 0.0.1 历史，其余 20 个插件保持。

默认方案包更新六个 schema 的名称，与 App 面板及管理页统一为：九宫格拼音、全键盘拼音、手写键盘、笔画键盘、五笔键盘、双拼键盘。顺序和默认九键与原市场包一致；六 schema 除 name 外解析结构相同，词库、模型、版本不变。包内说明和双拼／笔画适配后来源摘要同步于主仓 [PR61](https://github.com/JamesGZM/Moki/pull/61)（`618e161db4cae2fde2f312b957573876e74be323`）。商店包不含 `*.custom.yaml` 模板或手写模型；单字手写及删除行为修复属于 App，方案更新不替代 App 安装。

旧条目分别完整保存于 [AI 回复快照](../archives/ai-reply-before-settings-0.0.2.yaml) 和 [默认方案快照](../archives/builtin-before-names-0.0.1.yaml)。同一版本不在 versions 重复添加，也不把不同内容当作镜像。同版本修订不会触发升版提示，需要使用本次附件导入覆盖，无需卸载或清数据。

发布前已验证 AI 包与此前通过 293 项源码回归／生产类型检查及已装手机的包一致；本次实际包内压缩脚本另执行 293 项 QuickJS 回归通过。默认方案 5 项打包回归通过，包括可复现、完整资源、六名称与顺序、来源摘要、排除用户配置模板。两份包及各自 SHA256SUMS 已匿名下载并逐字节核对；没有在本轮执行手机输入、视觉验收或真实模型请求。Release tag 基于发布前 index main，内容来源按上述主仓提交和文件摘要追溯。
