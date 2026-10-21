# TypeSafe 兼容 JEV

通过 TypeSafe System One 兼容接口进行在线判断，供 Moki 的局势判断与候选回复排序使用。

配置三项必填值：

| 配置 | 含义 |
| --- | --- |
| 接口地址 | 完整的 HTTP(S) POST 地址，例如 `https://example.com/v1/systemone`；也可填写网关自定义路径和查询参数，不会追加或改写路径。 |
| API Key | 对应服务的密钥，加密保存，请求时使用 `Authorization: Bearer`。 |
| 模型名 | 服务商提供的 JEV 模型标识。 |

保存配置后，Moki 按插件的 `allowCustomHosts` 声明授权所填地址的域名。没有预设地址、模型或密钥。地址不接受账号密码、空白或 `#` 片段。

请求保持 `{model, state, questions}`；响应交给宿主按 `answers` 解析，支持 `noul`、`choice`、`score` 和 `best_reply` 排序。协议参考 [TypeSafe System One API](https://docs.typesafe.ai/api/system-one)，不调用 OpenAI Chat Completions。

新 ID 为 `com.jxmfkj.ai.ime.plugin.typesafe_jev`，替换当前商店中的博查 JEV。已有设备需安装、选择新插件并重新填写配置；不迁移旧插件的数据或选择，也不会远程卸载旧插件。

开发验证（Node.js 24）：

```sh
node --experimental-vm-modules plugins/typesafe-jev/main.test.mjs
npx --yes -p typescript tsc -p plugins/typesafe-jev/tsconfig.json --noEmit
```

另用 `mopm build` 生成实际 QuickJS 产物后，设置 `MOKI_JEV_BUNDLE` 为该 `main.js` 的绝对路径，运行同一测试以核对分发产物；打包使用 `mopm pack`。生成的 `main.js` 和 `.mopk` 不进入版本库。
