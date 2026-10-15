// OpenAI 兼容 OCR。由 main.ts 编译为 QuickJS 单文件：全局 plugin = definePlugin(...)
var plugin = (function () {
  var KEY_BASE_URL = "baseUrl";
  var KEY_API_KEY = "apiKey";
  var KEY_MODEL = "model";
  var PROMPT = "只输出图中文字，保持原有换行，不要解释。";
  var REQUEST_TIMEOUT_MS = 60000;

  function trim(value) {
    return (value || "").replace(/^\s+/, "").replace(/\s+$/, "");
  }

  function clip(value, apiKey) {
    var text = value;
    if (apiKey !== "") text = text.split(apiKey).join("");
    text = trim(text.replace(/\s+/g, " "));
    if (text.length > 80) text = text.substring(0, 80) + "…";
    return text;
  }

  function serverDetail(body, apiKey) {
    var message = "";
    try {
      var data = JSON.parse(body || "");
      if (data !== null && typeof data === "object") {
        var error = data.error;
        if (typeof error === "string") message = error;
        else if (error !== null && typeof error === "object") {
          var nested = error.message;
          if (typeof nested === "string") message = nested;
        }
      }
    } catch (e) {
      message = "";
    }
    var detail = clip(message, apiKey);
    return detail === "" ? "" : "：" + detail;
  }

  function httpFailure(status, body, apiKey) {
    var detail = serverDetail(body, apiKey);
    if (status === 401) return new MokiError("E_NETWORK", "API Key 无效或未授权（HTTP 401）" + detail);
    if (status === 403) return new MokiError("E_DENIED", "没有访问该接口的权限（HTTP 403）" + detail);
    if (status === 408 || status === 504) return new MokiError("E_TIMEOUT", "识别超时，请稍后重试（HTTP " + String(status) + "）");
    if (status === 429) return new MokiError("E_NETWORK", "请求过于频繁，请稍后再试（HTTP 429）" + detail);
    return new MokiError("E_NETWORK", "识别接口返回 HTTP " + String(status) + detail);
  }

  function hostFailure(error) {
    var code = error !== null && typeof error === "object" && typeof error.code === "string" ? error.code : "E_NETWORK";
    var raw = error !== null && typeof error === "object" && typeof error.message === "string" ? error.message : "";
    if (code === "E_TIMEOUT" || /timeout|timed out/i.test(raw)) {
      return new MokiError("E_TIMEOUT", "识别超时，请稍后重试");
    }
    if (code === "E_DENIED") {
      return new MokiError("E_DENIED", "接口地址未获联网授权，请确认地址后重新保存");
    }
    var detail = clip(raw, "");
    if (code === "E_INVALID") {
      return new MokiError("E_INVALID", detail === "" ? "请求无效" : "请求无效：" + detail);
    }
    return new MokiError("E_NETWORK", detail === "" ? "网络连接失败" : "网络连接失败：" + detail);
  }

  function readContent(content) {
    if (typeof content === "string") return content;
    if (!Array.isArray(content)) return "";
    var parts = [];
    for (var i = 0; i < content.length; i++) {
      var part = content[i];
      if (typeof part === "string") parts.push(part);
      else if (part !== null && typeof part === "object" && typeof part.text === "string") parts.push(part.text);
    }
    return parts.join("\n");
  }

  function dimension(value) {
    if (!isFinite(value) || value < 0) return 0;
    return Math.floor(value);
  }

  return definePlugin({
    settings: {
      schema: function () {
        return [
          {
            key: KEY_BASE_URL,
            label: "接口地址",
            type: "input",
            required: true,
            placeholder: "https://example.com/v1",
            helpText: "OpenAI 兼容接口地址（/chat/completions 前缀），域名将自动获得联网授权"
          },
          {
            key: KEY_API_KEY,
            label: "API Key",
            type: "secret",
            required: true,
            placeholder: "输入 API Key",
            helpText: "OpenAI 兼容接口的 API Key"
          },
          {
            key: KEY_MODEL,
            label: "模型名",
            type: "input",
            required: true,
            placeholder: "模型名",
            helpText: "用于识图的模型名称"
          }
        ];
      }
    },
    ocr: {
      recognize: async function (image) {
        var baseUrl = trim(host.config.get(KEY_BASE_URL));
        var apiKey = trim(host.config.get(KEY_API_KEY));
        var model = trim(host.config.get(KEY_MODEL));
        if (baseUrl === "") throw new MokiError("E_INVALID", "请填写接口地址");
        if (apiKey === "") throw new MokiError("E_INVALID", "请填写 API Key");
        if (model === "") throw new MokiError("E_INVALID", "请填写模型名");
        if (!/^https?:\/\//i.test(baseUrl)) {
          throw new MokiError("E_INVALID", "接口地址需要以 http:// 或 https:// 开头");
        }
        if (image.bytes == null || typeof image.bytes.byteLength !== "number" || image.bytes.byteLength === 0) {
          throw new MokiError("E_INVALID", "图片内容为空");
        }

        var mime = trim(image.mime) === "" ? "image/jpeg" : trim(image.mime);
        var bytes = new Uint8Array(image.bytes);
        var dataUrl = "data:" + mime + ";base64," + host.crypto.base64(bytes).replace(/\s+/g, "");
        var payload = JSON.stringify({
          model: model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: PROMPT },
                { type: "image_url", image_url: { url: dataUrl } }
              ]
            }
          ]
        });
        var headers = {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey
        };
        var url = baseUrl.replace(/\/+$/, "") + "/chat/completions";

        var resp;
        try {
          resp = await host.http.request("POST", url, headers, new TextEncoder().encode(payload), REQUEST_TIMEOUT_MS);
        } catch (error) {
          var failure = hostFailure(error);
          host.logError(failure.message);
          throw failure;
        }
        if (resp.status < 200 || resp.status >= 300) {
          var httpError = httpFailure(resp.status, resp.text, apiKey);
          host.logError(httpError.message);
          throw httpError;
        }

        var data = null;
        try {
          data = JSON.parse(resp.text);
        } catch (error) {
          throw new MokiError("E_INVALID", "无法解析识别结果");
        }
        var choices = data !== null && typeof data === "object" ? data.choices : undefined;
        if (!Array.isArray(choices) || choices.length === 0) {
          throw new MokiError("E_INVALID", "接口没有返回识别结果");
        }
        var message = choices[0].message;
        if (message && typeof message.refusal === "string" && trim(message.refusal) !== "") {
          throw new MokiError("E_INVALID", "模型拒绝识别：" + clip(message.refusal, apiKey));
        }
        var text = trim(readContent(message ? message.content : ""));
        if (text === "") return { text: "", blocks: [] };
        var width = dimension(image.width);
        var height = dimension(image.height);
        return {
          text: text,
          blocks: [{ text: text, bounds: [0, 0, width, height] }]
        };
      }
    }
  });
})();
