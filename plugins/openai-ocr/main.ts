// OpenAI 兼容 OCR（TypeScript 源码，编译为 QuickJS 单文件 main.js）
//
// 设置只收集接口地址、API Key、模型名。提示词固定在脚本内，不出现在表单里。
// 识别走 POST {baseUrl}/chat/completions，图片用 data URL。整段文字包成覆盖全图的一个文字块。

const KEY_BASE_URL = 'baseUrl';
const KEY_API_KEY = 'apiKey';
const KEY_MODEL = 'model';

/** 固定提示词：只输出图中文字，保持原有换行，不要解释。 */
const PROMPT = '只输出图中文字，保持原有换行，不要解释。';

const REQUEST_TIMEOUT_MS = 60000;

function trim(value: string | null | undefined): string {
  return (value || '').replace(/^\s+/, '').replace(/\s+$/, '');
}

function clip(value: string, apiKey: string): string {
  let text = value;
  if (apiKey !== '') text = text.split(apiKey).join('');
  text = trim(text.replace(/\s+/g, ' '));
  if (text.length > 80) text = text.substring(0, 80) + '…';
  return text;
}

function serverDetail(body: string, apiKey: string): string {
  let message = '';
  try {
    const data: unknown = JSON.parse(body || '');
    if (data !== null && typeof data === 'object') {
      const error = (data as { error?: unknown }).error;
      if (typeof error === 'string') message = error;
      else if (error !== null && typeof error === 'object') {
        const nested = (error as { message?: unknown }).message;
        if (typeof nested === 'string') message = nested;
      }
    }
  } catch (e) {
    message = '';
  }
  const detail = clip(message, apiKey);
  return detail === '' ? '' : '：' + detail;
}

function httpFailure(status: number, body: string, apiKey: string): MokiError {
  const detail = serverDetail(body, apiKey);
  if (status === 401) return new MokiError('E_NETWORK', 'API Key 无效或未授权（HTTP 401）' + detail);
  if (status === 403) return new MokiError('E_DENIED', '没有访问该接口的权限（HTTP 403）' + detail);
  if (status === 408 || status === 504) return new MokiError('E_TIMEOUT', '识别超时，请稍后重试（HTTP ' + String(status) + '）');
  if (status === 429) return new MokiError('E_NETWORK', '请求过于频繁，请稍后再试（HTTP 429）' + detail);
  return new MokiError('E_NETWORK', '识别接口返回 HTTP ' + String(status) + detail);
}

function hostFailure(error: unknown): MokiError {
  const code = error !== null && typeof error === 'object' && typeof (error as { code?: unknown }).code === 'string'
    ? (error as { code: string }).code
    : 'E_NETWORK';
  const raw = error !== null && typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string'
    ? (error as { message: string }).message
    : '';
  if (code === 'E_TIMEOUT' || /timeout|timed out/i.test(raw)) {
    return new MokiError('E_TIMEOUT', '识别超时，请稍后重试');
  }
  if (code === 'E_DENIED') {
    return new MokiError('E_DENIED', '接口地址未获联网授权，请确认地址后重新保存');
  }
  const detail = clip(raw, '');
  if (code === 'E_INVALID') {
    return new MokiError('E_INVALID', detail === '' ? '请求无效' : '请求无效：' + detail);
  }
  return new MokiError('E_NETWORK', detail === '' ? '网络连接失败' : '网络连接失败：' + detail);
}

function readContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  const parts: string[] = [];
  for (const part of content) {
    if (typeof part === 'string') parts.push(part);
    else if (part !== null && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string') {
      parts.push((part as { text: string }).text);
    }
  }
  return parts.join('\n');
}

function dimension(value: number): number {
  if (!isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

const plugin = definePlugin({
  settings: {
    schema(): MokiUiNode[] {
      return [
        {
          key: KEY_BASE_URL,
          label: '接口地址',
          type: 'input',
          required: true,
          placeholder: 'https://example.com/v1',
          helpText: 'OpenAI 兼容接口地址（/chat/completions 前缀），域名将自动获得联网授权',
        },
        {
          key: KEY_API_KEY,
          label: 'API Key',
          type: 'secret',
          required: true,
          placeholder: '输入 API Key',
          helpText: 'OpenAI 兼容接口的 API Key',
        },
        {
          key: KEY_MODEL,
          label: '模型名',
          type: 'input',
          required: true,
          placeholder: '模型名',
          helpText: '用于识图的模型名称',
        },
      ];
    },
  },

  ocr: {
    async recognize(image: MokiOcrRequest): Promise<MokiOcrResult> {
      const baseUrl = trim(host.config.get(KEY_BASE_URL));
      const apiKey = trim(host.config.get(KEY_API_KEY));
      const model = trim(host.config.get(KEY_MODEL));
      if (baseUrl === '') throw new MokiError('E_INVALID', '请填写接口地址');
      if (apiKey === '') throw new MokiError('E_INVALID', '请填写 API Key');
      if (model === '') throw new MokiError('E_INVALID', '请填写模型名');
      if (!/^https?:\/\//i.test(baseUrl)) {
        throw new MokiError('E_INVALID', '接口地址需要以 http:// 或 https:// 开头');
      }
      if (image.bytes == null || typeof image.bytes.byteLength !== 'number' || image.bytes.byteLength === 0) {
        throw new MokiError('E_INVALID', '图片内容为空');
      }

      const mime = trim(image.mime) === '' ? 'image/jpeg' : trim(image.mime);
      const bytes = new Uint8Array(image.bytes);
      const dataUrl = 'data:' + mime + ';base64,' + host.crypto.base64(bytes).replace(/\s+/g, '');
      const payload = JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
      });
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      };
      const url = baseUrl.replace(/\/+$/, '') + '/chat/completions';

      let resp: MokiHttpResponse;
      try {
        resp = await host.http.request('POST', url, headers, new TextEncoder().encode(payload), REQUEST_TIMEOUT_MS);
      } catch (error) {
        const failure = hostFailure(error);
        host.logError(failure.message);
        throw failure;
      }
      if (resp.status < 200 || resp.status >= 300) {
        const failure = httpFailure(resp.status, resp.text, apiKey);
        host.logError(failure.message);
        throw failure;
      }

      let data: unknown = null;
      try {
        data = JSON.parse(resp.text);
      } catch (error) {
        throw new MokiError('E_INVALID', '无法解析识别结果');
      }
      const choices = data !== null && typeof data === 'object'
        ? (data as { choices?: unknown }).choices
        : undefined;
      if (!Array.isArray(choices) || choices.length === 0) {
        throw new MokiError('E_INVALID', '接口没有返回识别结果');
      }
      const message = (choices[0] as { message?: { content?: unknown; refusal?: unknown } }).message;
      if (message && typeof message.refusal === 'string' && trim(message.refusal) !== '') {
        throw new MokiError('E_INVALID', '模型拒绝识别：' + clip(message.refusal, apiKey));
      }
      const text = trim(readContent(message ? message.content : ''));
      if (text === '') return { text: '', blocks: [] };
      const width = dimension(image.width);
      const height = dimension(image.height);
      return {
        text: text,
        blocks: [{ text: text, bounds: [0, 0, width, height] }],
      };
    },
  },
});

export default plugin;
