const subject = (globalThis as any).plugin;

function configure(endpoint = 'https://fixture.example/v1/systemone') {
  host.config.set('endpoint', endpoint);
  host.config.set('apiKey', 'synthetic-key');
  host.config.set('model', 'fixture-jev');
}

test('三项配置必填且无默认服务，不完整时不触发网络', async () => {
  const expected = { endpoint: '尚未配置接口地址', apiKey: '尚未配置 API Key', model: '尚未配置模型名' };
  for (const key of Object.keys(expected)) {
    configure();
    host.config.set(key, '');
    const before = __mokiMock.httpRequests.length;
    const result = await subject.jev.postSystemOne('{"state":{},"questions":{}}');
    assert.equal(result.ok, false);
    assert.equal(result.message, expected[key]);
    assert.equal(__mokiMock.httpRequests.length, before);
  }
});

test('完整自定义路径和查询原样请求，字节载荷保留System One契约', async () => {
  const endpoint = 'https://fixture.example/api/decisions/?route=jev&path=%2Fv1%2Fsystemone';
  configure(' ' + endpoint + ' ');
  const response = '{"model":"fixture-jev","answers":{"best_reply":{"type":"choice","choice":"reply_b","confidence":0.5,"probabilities":{"reply_a":0.2,"reply_b":0.8}}}}';
  __mokiMock.addHttpResponse('POST', endpoint, { status: 200, text: response });
  const state = { background: '合成背景', chat: { latest_from: 'me', messages: [] } };
  const questions = { best_reply: { type: 'choice', instructions: '合成排序题', criteria: { reply_a: '甲', reply_b: '乙' } } };
  const result = await subject.jev.postSystemOne(JSON.stringify({ model: 'ignored', state, questions }));
  assert.equal(result.ok, true);
  assert.equal(result.body, response);
  const request = __mokiMock.httpRequests[__mokiMock.httpRequests.length - 1];
  assert.equal(request.url, endpoint);
  assert.equal(request.headers.Authorization, 'Bearer synthetic-key');
  assert.equal(request.body instanceof Uint8Array, true);
  assert.deepEqual(JSON.parse(new TextDecoder().decode(request.body)), { model: 'fixture-jev', state, questions });
});

test('缺主机或包含片段的地址在发请求之前拒绝', async () => {
  for (const endpoint of ['https://', 'https://fixture.example/evaluate#part']) {
    configure(endpoint);
    const before = __mokiMock.httpRequests.length;
    assert.equal((await subject.jev.postSystemOne('{"state":{},"questions":{}}')).ok, false);
    assert.equal(__mokiMock.httpRequests.length, before);
  }
});

test('鉴权失败不重试且错误消息不泄露密钥', async () => {
  const endpoint = 'https://fixture.example/unauthorized';
  configure(endpoint);
  __mokiMock.addHttpResponse('POST', endpoint, { status: 401, text: 'unauthorized synthetic-key' });
  const before = __mokiMock.httpRequests.length;
  const result = await subject.jev.postSystemOne('{"state":{},"questions":{}}');
  assert.equal(result.ok, false);
  assert.equal(result.message.indexOf('synthetic-key'), -1);
  assert.equal(__mokiMock.httpRequests.length, before + 1);
});
