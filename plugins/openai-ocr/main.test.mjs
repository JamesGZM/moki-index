import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

class MokiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "MokiError";
  }
}

function load(host) {
  const context = {
    definePlugin: (spec) => spec,
    host,
    MokiError,
    TextEncoder,
    Uint8Array,
    console,
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(process.env.MOKI_OCR_BUNDLE || new URL("./main.js", import.meta.url), "utf8"), context);
  return context.plugin;
}

function config(values) {
  return {
    get(key) {
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null;
    },
  };
}

function image(extra = {}) {
  return {
    bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
    mime: "image/jpeg",
    width: 32,
    height: 16,
    rotationDegrees: 0,
    languageHint: "",
    ...extra,
  };
}

const logs = [];

function baseHost(overrides = {}) {
  logs.length = 0;
  return {
    log() {},
    logError(message) {
      logs.push(message);
    },
    config: config({
      baseUrl: "https://vision.example.com/v1/",
      apiKey: "sk-test",
      model: "vision-model",
    }),
    crypto: {
      base64(bytes) {
        return Buffer.from(bytes).toString("base64");
      },
    },
    http: {
      async request() {
        throw new MokiError("E_NETWORK", "未 stub");
      },
    },
    ...overrides,
  };
}

const schemaPlugin = load(baseHost());
const schema = JSON.parse(JSON.stringify(schemaPlugin.settings.schema()));
assert.equal(schema.length, 3);
assert.deepEqual(schema.map((field) => field.key), ["baseUrl", "apiKey", "model"]);
assert.deepEqual(schema.map((field) => field.type), ["input", "secret", "input"]);
assert.ok(schema.every((field) => field.required === true));
assert.ok(schema.every((field) => field.defaultValue === undefined));
assert.equal(JSON.stringify(schema).includes("只输出图中文字"), false);
assert.equal(typeof schemaPlugin.ocr.recognize, "function");

{
  let seen;
  const plugin = load(baseHost({
    http: {
      async request(method, url, headers, body, timeout) {
        seen = { method, url, headers, body: new TextDecoder().decode(body), timeout };
        return {
          status: 200,
          headers: {},
          body: new Uint8Array(),
          text: JSON.stringify({
            choices: [{ message: { content: "第一行\n第二行" } }],
          }),
        };
      },
    },
  }));
  const result = await plugin.ocr.recognize(image());
  assert.equal(seen.method, "POST");
  assert.equal(seen.url, "https://vision.example.com/v1/chat/completions");
  assert.equal(seen.headers.Authorization, "Bearer sk-test");
  assert.equal(seen.timeout, 60000);
  const payload = JSON.parse(seen.body);
  assert.equal(payload.model, "vision-model");
  assert.equal(payload.messages[0].content[0].text, "只输出图中文字，保持原有换行，不要解释。");
  assert.equal(payload.messages[0].content[1].image_url.url, "data:image/jpeg;base64,/9j/2Q==");
  assert.equal(result.text, "第一行\n第二行");
  assert.deepEqual(JSON.parse(JSON.stringify(result.blocks)), [{ text: "第一行\n第二行", bounds: [0, 0, 32, 16] }]);
}

{
  const plugin = load(baseHost({
    http: {
      async request() {
        return {
          status: 200,
          text: JSON.stringify({ choices: [{ message: { content: [{ type: "text", text: "甲" }, { type: "text", text: "乙" }] } }] }),
        };
      },
    },
  }));
  const result = await plugin.ocr.recognize(image({ mime: "image/png", width: 0, height: 0 }));
  assert.equal(result.text, "甲\n乙");
  assert.deepEqual(JSON.parse(JSON.stringify(result.blocks[0].bounds)), [0, 0, 0, 0]);
}

{
  const plugin = load(baseHost({
    http: {
      async request() {
        return { status: 200, text: JSON.stringify({ choices: [{ message: { content: "  \n" } }] }) };
      },
    },
  }));
  const result = await plugin.ocr.recognize(image());
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { text: "", blocks: [] });
}

{
  const plugin = load(baseHost({
    http: {
      async request() {
        return {
          status: 401,
          text: JSON.stringify({ error: { message: "invalid key sk-test" } }),
        };
      },
    },
  }));
  await assert.rejects(plugin.ocr.recognize(image()), (error) => {
    assert.equal(error.code, "E_NETWORK");
    assert.match(error.message, /API Key 无效或未授权（HTTP 401）/);
    assert.equal(error.message.includes("sk-test"), false);
    return true;
  });
  assert.match(logs[0], /HTTP 401/);
}

{
  const plugin = load(baseHost({
    http: {
      async request() {
        throw new MokiError("E_TIMEOUT", "deadline exceeded");
      },
    },
  }));
  await assert.rejects(plugin.ocr.recognize(image()), (error) => {
    assert.equal(error.code, "E_TIMEOUT");
    assert.equal(error.message, "识别超时，请稍后重试");
    return true;
  });
}

{
  const plugin = load(baseHost({
    http: {
      async request() {
        throw new MokiError("E_NETWORK", "Unable to resolve host");
      },
    },
  }));
  await assert.rejects(plugin.ocr.recognize(image()), (error) => {
    assert.equal(error.code, "E_NETWORK");
    assert.equal(error.message, "网络连接失败：Unable to resolve host");
    return true;
  });
}

{
  const plugin = load(baseHost({
    http: {
      async request() {
        throw new MokiError("E_DENIED", "host not allowed");
      },
    },
  }));
  await assert.rejects(plugin.ocr.recognize(image()), (error) => {
    assert.equal(error.code, "E_DENIED");
    assert.match(error.message, /未获联网授权/);
    return true;
  });
}

{
  const plugin = load(baseHost({
    config: config({ baseUrl: "", apiKey: "sk-test", model: "m" }),
  }));
  await assert.rejects(plugin.ocr.recognize(image()), /请填写接口地址/);
}

{
  const plugin = load(baseHost({
    config: config({ baseUrl: "ftp://vision.example.com/v1", apiKey: "sk-test", model: "m" }),
  }));
  await assert.rejects(plugin.ocr.recognize(image()), /http:\/\/ 或 https:\/\//);
}

{
  const plugin = load(baseHost());
  await assert.rejects(plugin.ocr.recognize(image({ bytes: new Uint8Array() })), /图片内容为空/);
}

console.log("openai-ocr tests passed");
