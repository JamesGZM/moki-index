import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { stripTypeScriptTypes } from "node:module";

class MokiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "MokiError";
  }
}

const logs = [];
let ticks = 0;

async function load(host) {
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
  if (process.env.MOKI_JEV_BUNDLE) {
    vm.runInContext(fs.readFileSync(process.env.MOKI_JEV_BUNDLE, "utf8"), context);
    return context.plugin;
  }
  // CI 直接执行当前 TS 源码；分发验证额外对 mopm 新编译的产物运行同一组断言。
  const module = new vm.SourceTextModule(stripTypeScriptTypes(
    fs.readFileSync(new URL("./main.ts", import.meta.url), "utf8")), { context });
  await module.link(() => { throw new Error("Unexpected module import"); });
  await module.evaluate();
  return module.namespace.default;
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
    config: config({ endpoint: "https://judge.example.com/custom/decisions?route=one", apiKey: "sk-test-secret", model: "custom-jev" }),
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

const schemaPlugin = await load(baseHost());
const schema = JSON.parse(JSON.stringify(schemaPlugin.settings.schema()));
assert.equal(schema.length, 3);
assert.deepEqual(schema.map((field) => field.key), ["endpoint", "apiKey", "model"]);
assert.deepEqual(schema.map((field) => field.type), ["input", "secret", "input"]);
assert.ok(schema.every((field) => field.required === true));
assert.ok(schema.every((field) => field.defaultValue === undefined));
assert.equal(typeof schemaPlugin.jev.postSystemOne, "function");

{
  const client = http(() => ({
    status: 200,
    headers: {},
    body: new Uint8Array(),
    text: '{"answers":[{"choice":"A"}]}',
  }));
  const plugin = await load(baseHost({ http: client }));
  const result = await plugin.jev.postSystemOne(JSON.stringify({
    model: "ignored-incoming-model",
    state: { chat: { messages: [{ from: "other", text: "合成对话" }] } },
    questions: { q1: { type: "choice", instructions: "选一个", criteria: { a: "甲", b: "乙" } } },
  }));
  assert.equal(client.calls.length, 1);
  assert.equal(client.calls[0].method, "POST");
  assert.equal(client.calls[0].url, "https://judge.example.com/custom/decisions?route=one");
  assert.equal(client.calls[0].headers.Authorization, "Bearer sk-test-secret");
  assert.equal(client.calls[0].headers["Content-Type"], "application/json");
  assert.equal(client.calls[0].timeout, 40000);
  assert.equal(client.calls[0].bodyIsBytes, true);
  assert.deepEqual(JSON.parse(client.calls[0].body), {
    model: "custom-jev",
    state: { chat: { messages: [{ from: "other", text: "合成对话" }] } },
    questions: { q1: { type: "choice", instructions: "选一个", criteria: { a: "甲", b: "乙" } } },
  });
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { ok: true, body: '{"answers":[{"choice":"A"}]}' });
  assert.equal(ticks, 0);
}

{
  const calls = [];
  const plugin = await load(baseHost({
    config: config({ endpoint: "https://judge.example.com/v1/systemone", apiKey: "  ", model: "custom-jev" }),
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
  const plugin = await load(baseHost({ http: client }));
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
  const plugin = await load(baseHost({ http: client }));
  const result = await plugin.jev.postSystemOne('{"state":{"n":1},"questions":[]}');
  assert.equal(client.calls.length, 2);
  assert.equal(result.ok, true);
  assert.equal(result.body, '{"answers":[]}');
  assert.equal(ticks, 1001);
  assert.equal(logs.length, 0);
}

{
  const client = http(() => ({ status: 529, headers: {}, body: new Uint8Array(), text: "" }));
  const plugin = await load(baseHost({ http: client }));
  const result = await plugin.jev.postSystemOne('{"state":{},"questions":[]}');
  assert.equal(client.calls.length, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { ok: false, message: "服务繁忙，已重试（HTTP 529）" });
  assert.equal(result.message.includes("sk-test-secret"), false);
}

{
  const client = http(() => ({ status: 500, headers: {}, body: new Uint8Array(), text: "boom sk-test-secret" }));
  const plugin = await load(baseHost({ http: client }));
  const result = await plugin.jev.postSystemOne('{"state":{},"questions":[]}');
  assert.equal(client.calls.length, 3);
  assert.equal(result.ok, false);
  assert.equal(result.message, "判断接口 HTTP 500：boom");
  assert.equal(result.message.includes("sk-test-secret"), false);
}

{
  const client = http(() => ({ status: 400, headers: {}, body: new Uint8Array(), text: "bad request" }));
  const plugin = await load(baseHost({ http: client }));
  const result = await plugin.jev.postSystemOne('{"state":{},"questions":[]}');
  assert.equal(client.calls.length, 1);
  assert.equal(result.message, "判断接口 HTTP 400：bad request");
}

{
  let calls = 0;
  const plugin = await load(baseHost({
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
  const plugin = await load(baseHost({
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
  const plugin = await load(baseHost());
  const bad = await plugin.jev.postSystemOne("not-json");
  const list = await plugin.jev.postSystemOne("[]");
  assert.equal(bad.message, "请求内容不是合法 JSON");
  assert.equal(list.message, "请求内容不是合法 JSON");
}

{
  const client = http(() => ({ status: 200, headers: {}, body: new Uint8Array(), text: "   " }));
  const plugin = await load(baseHost({ http: client }));
  const result = await plugin.jev.postSystemOne('{"state":{},"questions":[]}');
  assert.equal(result.message, "判断接口响应体为空");
}

// 配置为空时不使用任何服务商或模型默认值，也不发请求。
for (const [key, message] of [["endpoint", "尚未配置接口地址"], ["apiKey", "尚未配置 API Key"], ["model", "尚未配置模型名"]]) {
  const values = { endpoint: "https://fixture.example/v1/systemone", apiKey: "sk-test-secret", model: "fixture-jev", [key]: "  " };
  const client = http(() => { throw new Error("必须在网络请求前拒绝"); });
  const plugin = await load(baseHost({ config: config(values), http: client }));
  const result = await plugin.jev.postSystemOne('{"state":{},"questions":{}}');
  assert.equal(result.ok, false);
  assert.equal(result.message, message);
  assert.equal(client.calls.length, 0);
}

// 不固定追加 /v1/systemone，不删尾斜杠或改写查询参数。
for (const endpoint of [
  "https://fixture.example/v1/systemone",
  "https://fixture.example/api/alpha/decisions",
  "https://fixture.example/proxy/decision/?route=jev&path=%2Fv1%2Fsystemone",
  "http://127.0.0.1:8420/custom/evaluate",
  "http://[::1]:8420/custom/evaluate",
]) {
  const client = http(() => ({ status: 200, text: '{"answers":{}}' }));
  const plugin = await load(baseHost({
    config: config({ endpoint: "  " + endpoint + "  ", apiKey: " sk-test-secret ", model: " fixture-jev " }),
    http: client,
  }));
  assert.equal((await plugin.jev.postSystemOne('{"state":[],"questions":{}}')).ok, true);
  assert.equal(client.calls[0].url, endpoint);
  assert.equal(client.calls[0].headers.Authorization, "Bearer sk-test-secret");
  assert.equal(JSON.parse(client.calls[0].body).model, "fixture-jev");
}

for (const endpoint of [
  "fixture.example/v1/systemone", "ftp://fixture.example/evaluate", "https://",
  "https:///v1/systemone", "https://fixture.example/a b", "https://fixture.example/evaluate#part",
  "https://user:password@fixture.example/evaluate", "https://fixture.example/evaluate\n?route=jev",
]) {
  const client = http(() => { throw new Error("无效地址不能发请求"); });
  const plugin = await load(baseHost({
    config: config({ endpoint, apiKey: "sk-test-secret", model: "fixture-jev" }), http: client,
  }));
  const result = await plugin.jev.postSystemOne('{"state":{},"questions":{}}');
  assert.equal(result.ok, false, endpoint);
  assert.equal(client.calls.length, 0, endpoint);
  assert.equal(result.message.includes("password"), false);
  assert.equal(result.message.includes("sk-test-secret"), false);
}

// noul／choice／score 及 best_reply 均透传 System One 字段，不生成 messages。
for (const questions of [
  { literal_question: { type: "noul", instructions: "合成是非题", criteria: { true: "甲", false: "乙" } },
    danger_level: { type: "score", instructions: "合成等级题", criteria: ["低", "中", "高"] } },
  { best_reply: { type: "choice", instructions: "合成排序题", criteria: { reply_a: "候选甲", reply_b: "候选乙" } } },
]) {
  const body = JSON.stringify({ model: "fixture-jev", answers: { fixture: { type: "noul", noul: 0.5 } } });
  const client = http(() => ({ status: 200, text: body }));
  const plugin = await load(baseHost({ http: client }));
  const state = { background: "合成背景", chat: { latest_from: "me", messages: [] }, history: [] };
  const result = await plugin.jev.postSystemOne(JSON.stringify({ state, questions }));
  assert.deepEqual(JSON.parse(client.calls[0].body), { model: "custom-jev", state, questions });
  assert.equal(result.body, body);
}

const manifest = JSON.parse(fs.readFileSync(new URL("./manifest.json", import.meta.url), "utf8")
  .replace(/^\s*\/\/.*$/gm, ""));
assert.equal(manifest.id, "com.jxmfkj.ai.ime.plugin.typesafe_jev");
assert.equal(manifest.name, "TypeSafe 兼容 JEV");
assert.equal(manifest.type, "jev");
assert.equal(manifest.activation, "single");
assert.deepEqual(manifest.network, { allowCustomHosts: true });
assert.equal(fs.existsSync(new URL("../bocha-jev", import.meta.url)), false);

console.log("typesafe-jev tests passed (configuration, exact endpoints, System One payloads, retries, redaction, manifest)");
