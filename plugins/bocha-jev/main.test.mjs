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

const logs = [];
let ticks = 0;

function load(host) {
  ticks = 0;
  const context = {
    definePlugin: (spec) => spec,
    host,
    MokiError,
    TextEncoder,
    Uint8Array,
    JSON,
    Array,
    String,
    console,
    Date: {
      now() {
        return ++ticks;
      },
    },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(new URL("./main.js", import.meta.url), "utf8"), context);
  return context.plugin;
}

function config(values) {
  return {
    get(key) {
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null;
    },
  };
}

function baseHost(overrides = {}) {
  logs.length = 0;
  return {
    log() {},
    logError(message) {
      logs.push(message);
    },
    config: config({ apiKey: "sk-test-secret" }),
    http: {
      async request() {
        throw new MokiError("E_NETWORK", "未 stub");
      },
    },
    ...overrides,
  };
}

function http(handler) {
  const calls = [];
  return {
    calls,
    async request(method, url, headers, body, timeout) {
      const record = {
        method,
        url,
        headers,
        body: new TextDecoder().decode(body),
        bodyIsBytes: body instanceof Uint8Array,
        timeout,
      };
      calls.push(record);
      return handler(calls.length, record);
    },
  };
}

const schemaPlugin = load(baseHost());
const schema = JSON.parse(JSON.stringify(schemaPlugin.settings.schema()));
assert.equal(schema.length, 1);
assert.equal(schema[0].key, "apiKey");
assert.equal(schema[0].type, "secret");
assert.equal(schema[0].required, true);
assert.equal(typeof schemaPlugin.jev.postSystemOne, "function");

{
  const client = http(() => ({
    status: 200,
    headers: {},
    body: new Uint8Array(),
    text: '{"answers":[{"choice":"A"}]}',
  }));
  const plugin = load(baseHost({ http: client }));
  const result = await plugin.jev.postSystemOne(JSON.stringify({
    state: { cursor: 1 },
    questions: [{ id: "q1", prompt: "选一个" }],
  }));
  assert.equal(client.calls.length, 1);
  assert.equal(client.calls[0].method, "POST");
  assert.equal(client.calls[0].url, "https://jev.bocha.cn/v1/systemone");
  assert.equal(client.calls[0].headers.Authorization, "Bearer sk-test-secret");
  assert.equal(client.calls[0].headers["Content-Type"], "application/json");
  assert.equal(client.calls[0].timeout, 40000);
  assert.equal(client.calls[0].bodyIsBytes, true);
  assert.deepEqual(JSON.parse(client.calls[0].body), {
    model: "bocha-jev-v1",
    state: { cursor: 1 },
    questions: [{ id: "q1", prompt: "选一个" }],
  });
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { ok: true, body: '{"answers":[{"choice":"A"}]}' });
  assert.equal(ticks, 0);
}

{
  const calls = [];
  const plugin = load(baseHost({
    config: config({ apiKey: "  " }),
    http: {
      async request() {
        calls.push(1);
        return { status: 200, headers: {}, body: new Uint8Array(), text: "{}" };
      },
    },
  }));
  const result = await plugin.jev.postSystemOne('{"state":{},"questions":[]}');
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { ok: false, message: "尚未配置 API Key" });
  assert.equal(calls.length, 0);
  assert.equal(logs.length, 0);
}

{
  const client = http(() => ({
    status: 401,
    headers: {},
    body: new Uint8Array(),
    text: "unauthorized sk-test-secret",
  }));
  const plugin = load(baseHost({ http: client }));
  const result = await plugin.jev.postSystemOne('{"state":{},"questions":[]}');
  assert.equal(client.calls.length, 1);
  assert.equal(result.ok, false);
  assert.equal(result.message, "API Key 无效或未授权（HTTP 401）：unauthorized");
  assert.equal(result.message.includes("sk-test-secret"), false);
  assert.equal(logs.join("").includes("sk-test-secret"), false);
  assert.equal(ticks, 0);
}

{
  const client = http((n) => {
    if (n === 1) return { status: 429, headers: {}, body: new Uint8Array(), text: "slow sk-test-secret" };
    return { status: 200, headers: {}, body: new Uint8Array(), text: '{"answers":[]}' };
  });
  const plugin = load(baseHost({ http: client }));
  const result = await plugin.jev.postSystemOne('{"state":{"n":1},"questions":[]}');
  assert.equal(client.calls.length, 2);
  assert.equal(result.ok, true);
  assert.equal(result.body, '{"answers":[]}');
  assert.equal(ticks, 1001);
  assert.equal(logs.length, 0);
}

{
  const client = http(() => ({ status: 529, headers: {}, body: new Uint8Array(), text: "" }));
  const plugin = load(baseHost({ http: client }));
  const result = await plugin.jev.postSystemOne('{"state":{},"questions":[]}');
  assert.equal(client.calls.length, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { ok: false, message: "服务繁忙，已重试（HTTP 529）" });
  assert.equal(result.message.includes("sk-test-secret"), false);
}

{
  const client = http(() => ({ status: 500, headers: {}, body: new Uint8Array(), text: "boom sk-test-secret" }));
  const plugin = load(baseHost({ http: client }));
  const result = await plugin.jev.postSystemOne('{"state":{},"questions":[]}');
  assert.equal(client.calls.length, 3);
  assert.equal(result.ok, false);
  assert.equal(result.message, "判断接口 HTTP 500：boom");
  assert.equal(result.message.includes("sk-test-secret"), false);
}

{
  const client = http(() => ({ status: 400, headers: {}, body: new Uint8Array(), text: "bad request" }));
  const plugin = load(baseHost({ http: client }));
  const result = await plugin.jev.postSystemOne('{"state":{},"questions":[]}');
  assert.equal(client.calls.length, 1);
  assert.equal(result.message, "判断接口 HTTP 400：bad request");
}

{
  let calls = 0;
  const plugin = load(baseHost({
    http: {
      async request() {
        calls++;
        throw new MokiError("E_DENIED", "host denied sk-test-secret");
      },
    },
  }));
  const result = await plugin.jev.postSystemOne('{"state":{},"questions":[]}');
  assert.equal(calls, 1);
  assert.equal(result.message, "接口地址未获联网授权");
  assert.equal(result.message.includes("sk-test-secret"), false);
}

{
  let calls = 0;
  const plugin = load(baseHost({
    http: {
      async request() {
        calls++;
        throw new MokiError("E_TIMEOUT", "timed out");
      },
    },
  }));
  const result = await plugin.jev.postSystemOne('{"state":{},"questions":[]}');
  assert.equal(calls, 3);
  assert.equal(result.message, "网络超时，请检查连接");
}

{
  const plugin = load(baseHost());
  const bad = await plugin.jev.postSystemOne("not-json");
  const list = await plugin.jev.postSystemOne("[]");
  assert.equal(bad.message, "请求内容不是合法 JSON");
  assert.equal(list.message, "请求内容不是合法 JSON");
}

{
  const client = http(() => ({ status: 200, headers: {}, body: new Uint8Array(), text: "   " }));
  const plugin = load(baseHost({ http: client }));
  const result = await plugin.jev.postSystemOne('{"state":{},"questions":[]}');
  assert.equal(result.message, "判断接口响应体为空");
}

console.log("bocha-jev tests passed");
