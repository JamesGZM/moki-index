import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

const rulePath = '/rules/ocr-clean/com.jxmfkj.ai.ime.ocrrule.generic/1.0.0.json';
function assets() {
  return { ASSETS: { fetch: async (request) => {
    const path = new URL(request.url).pathname;
    if (path === '/index.yaml' || path === '/rules/ocr-clean/index.yaml') return new Response('{"schemaVersion":1,"rules":[]}');
    if (path === rulePath) return new Response('{"schemaVersion":1}');
    return new Response('Not Found', { status: 404 });
  } } };
}
test('规则索引与版本文件从本地静态资源提供，使用不同缓存策略', async () => {
  const index = await worker.fetch(new Request('https://example.test/rules/ocr-clean/index.yaml'), assets());
  assert.equal(index.status, 200); assert.match(index.headers.get('content-type'), /yaml/);
  assert.equal(index.headers.get('cache-control'), 'public, max-age=300');
  const rule = await worker.fetch(new Request('https://example.test' + rulePath), assets());
  assert.equal(rule.status, 200); assert.match(rule.headers.get('content-type'), /json/);
  assert.match(rule.headers.get('cache-control'), /immutable/); assert.equal(rule.headers.get('access-control-allow-origin'), '*');
  assert.deepEqual(await rule.json(), { schemaVersion: 1 });
});
test('主索引映射根路径；HEAD 不返回正文', async () => {
  assert.equal((await worker.fetch(new Request('https://example.test/'), assets())).status, 200);
  const response = await worker.fetch(new Request('https://example.test' + rulePath, { method: 'HEAD' }), assets());
  assert.equal(response.status, 200); assert.equal(await response.text(), '');
});
test('规则未知文件与缺失版本返回404，不转发远程；写入方法返回405', async () => {
  for (const path of ['/rules/ocr-clean/source.yaml', '/rules/ocr-clean/test/1.0.0.json', '/rules/other/index.yaml']) {
    assert.equal((await worker.fetch(new Request('https://example.test' + path), assets())).status, 404);
  }
  assert.equal((await worker.fetch(new Request('https://example.test' + rulePath, { method: 'POST' }), assets())).status, 405);
});
test('预检允许读取，旧 YAML 索引仍使用原代理', async () => {
  const options = await worker.fetch(new Request('https://example.test' + rulePath, { method: 'OPTIONS' }), assets());
  assert.equal(options.status, 204); assert.equal(options.headers.get('access-control-allow-origin'), '*');
  const original = globalThis.fetch; let called;
  globalThis.fetch = async (url) => { called = url; return new Response('index_version: 2'); };
  try {
    const result = await worker.fetch(new Request('https://example.test/plugins/v2/index.yaml'), { GITHUB_RAW_URL: 'https://upstream.test', ENV: 'dev' });
    assert.equal(result.status, 200); assert.equal(called, 'https://upstream.test/plugins/v2/index.yaml');
  } finally { globalThis.fetch = original; }
});
