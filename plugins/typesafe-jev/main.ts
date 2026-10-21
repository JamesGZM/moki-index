// 博查 JEV（TypeScript 源码，编译为 QuickJS 单文件 main.js）
//
// 宿主传入 {state, questions} 字符串。脚本补上 model 后 POST systemone。
// 429/529 与传输失败按 500ms 左移退避重试，最多 3 次；其它 4xx 不重试。
// 沙箱没有定时器，退避用 Date.now 等待。失败消息不得包含 API Key。

const KEY_API_KEY = 'apiKey';
const MODEL = 'bocha-jev-v1';
const ENDPOINT = 'https://jev.bocha.cn/v1/systemone';
const REQUEST_TIMEOUT_MS = 40000;
const MAX_ATTEMPTS = 3;

interface SystemOneRequest {
  state?: unknown;
  questions?: unknown;
}

interface JevCallResult {
  ok: boolean;
  body?: string;
  message?: string;
}

function trim(value: string | null | undefined): string {
  return (value || '').replace(/^\s+/, '').replace(/\s+$/, '');
}

function redact(value: string, apiKey: string): string {
  let text = value;
  if (apiKey !== '') text = text.split(apiKey).join('');
  text = trim(text.replace(/\s+/g, ' '));
  if (text.length > 120) text = text.substring(0, 120);
  return text;
}

function pause(ms: number): void {
  if (!(ms > 0) || typeof Date === 'undefined' || typeof Date.now !== 'function') return;
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // 等待退避。空循环依赖 Date.now，避免被当成无进展死循环以外的优化删掉。
  }
}

function backoffMs(attempt: number): number {
  return 500 << attempt;
}

function httpMessage(status: number, body: string, apiKey: string): string {
  const detail = redact(body, apiKey);
  if (status === 401) return joinDetail('API Key 无效或未授权（HTTP 401）', detail);
  if (status === 402) return joinDetail('账户额度不足（HTTP 402）', detail);
  if (status === 403) return joinDetail('没有访问该接口的权限（HTTP 403）', detail);
  if (status === 404) return joinDetail('判断接口不存在（HTTP 404）', detail);
  if (status === 408) return '网络超时，请检查连接';
  if (status === 429 || status === 529) return '服务繁忙，已重试（HTTP ' + String(status) + '）';
  const suffix = detail === '' ? '（响应体为空）' : detail;
  return '判断接口 HTTP ' + String(status) + '：' + suffix;
}

function joinDetail(message: string, detail: string): string {
  if (detail === '' || message.indexOf(detail) >= 0) return message;
  return message + '：' + detail;
}

function transportMessage(error: unknown, apiKey: string): string {
  const code = error !== null && typeof error === 'object' && typeof (error as { code?: unknown }).code === 'string'
    ? (error as { code: string }).code
    : '';
  const raw = error !== null && typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string'
    ? redact((error as { message: string }).message, apiKey)
    : '';
  if (code === 'E_TIMEOUT' || /timeout|timed out/i.test(raw)) return '网络超时，请检查连接';
  if (code === 'E_DENIED') return '接口地址未获联网授权';
  if (raw.indexOf('Unable to resolve host') >= 0) return '域名解析失败，地址填错或无网络';
  if (raw.indexOf('Failed to connect') >= 0 || raw.indexOf('ECONNREFUSED') >= 0) return '无法连接该地址';
  if (raw.indexOf('CertPath') >= 0 || raw.indexOf('SSL') >= 0) return 'HTTPS 证书校验失败';
  if (code === 'E_INVALID') return raw === '' ? '请求无效' : '请求无效：' + raw;
  return raw === '' ? '判断接口请求失败' : '判断接口请求失败：' + raw;
}

function shouldStop(error: unknown): boolean {
  const code = error !== null && typeof error === 'object' && typeof (error as { code?: unknown }).code === 'string'
    ? (error as { code: string }).code
    : '';
  return code === 'E_DENIED' || code === 'E_INVALID';
}

const plugin = definePlugin({
  settings: {
    schema(): MokiUiNode[] {
      return [
        {
          key: KEY_API_KEY,
          label: 'API Key',
          type: 'secret',
          required: true,
          placeholder: '输入 API Key',
          helpText: '加密保存在本插件配置里，请求使用 Authorization: Bearer',
        },
      ];
    },
  },

  jev: {
    async postSystemOne(requestJson: string): Promise<JevCallResult> {
      const apiKey = trim(host.config.get(KEY_API_KEY));
      if (apiKey === '') return { ok: false, message: '尚未配置 API Key' };

      let incoming: SystemOneRequest;
      try {
        const parsed: unknown = JSON.parse(requestJson);
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          return { ok: false, message: '请求内容不是合法 JSON' };
        }
        incoming = parsed as SystemOneRequest;
      } catch (error) {
        return { ok: false, message: '请求内容不是合法 JSON' };
      }

      const payload = new TextEncoder().encode(JSON.stringify({
        model: MODEL,
        state: incoming.state,
        questions: incoming.questions,
      }));
      const headers: Record<string, string> = {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      };

      let attempt = 0;
      let lastMessage = '判断接口请求失败';
      while (attempt < MAX_ATTEMPTS) {
        try {
          const resp = await host.http.request('POST', ENDPOINT, headers, payload, REQUEST_TIMEOUT_MS);
          if (resp.status === 429 || resp.status === 529) {
            lastMessage = httpMessage(resp.status, resp.text, apiKey);
            attempt++;
            if (attempt < MAX_ATTEMPTS) pause(backoffMs(attempt));
            continue;
          }
          if (resp.status < 200 || resp.status >= 300) {
            lastMessage = httpMessage(resp.status, resp.text, apiKey);
            if (resp.status >= 400 && resp.status <= 499) return fail(lastMessage);
            attempt++;
            if (attempt < MAX_ATTEMPTS) pause(backoffMs(attempt));
            continue;
          }
          if (trim(resp.text) === '') return fail('判断接口响应体为空');
          return { ok: true, body: resp.text };
        } catch (error) {
          lastMessage = transportMessage(error, apiKey);
          if (shouldStop(error)) return fail(lastMessage);
          attempt++;
          if (attempt < MAX_ATTEMPTS) pause(backoffMs(attempt));
        }
      }
      return fail(lastMessage);
    },
  },
});

function fail(message: string): JevCallResult {
  host.logError(message);
  return { ok: false, message: message };
}

export default plugin;
