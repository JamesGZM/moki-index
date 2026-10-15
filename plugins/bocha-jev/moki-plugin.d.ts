/** 本插件用到的宿主类型。完整定义见 MfkjImeHelper tools/moki-plugin/templates/moki-plugin.d.ts。 */

declare class MokiError extends Error {
  readonly code: string;
  constructor(code: string, message: string);
}

declare function definePlugin<T extends MokiPluginSpec>(spec: T): T;

interface MokiPluginSpec {
  settings?: { schema(): MokiUiNode[] };
  jev?: MokiJevExtension;
}

interface MokiUiNode {
  type: 'secret' | 'input' | 'textarea' | 'text';
  label?: string;
  key?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
}

interface MokiJevResult {
  ok: boolean;
  body?: string;
  message?: string;
}

interface MokiJevExtension {
  postSystemOne(requestJson: string): Promise<MokiJevResult>;
}

interface MokiHttpResponse {
  status: number;
  headers: Record<string, string>;
  body: Uint8Array;
  text: string;
}

interface MokiHost {
  log(message: string): void;
  logError(message: string): void;
  readonly config: { get(key: string): string | null };
  readonly http: {
    request(
      method: string,
      url: string,
      headers: Record<string, string>,
      body?: Uint8Array | null,
      timeoutMillis?: number,
    ): Promise<MokiHttpResponse>;
  };
}

declare const host: MokiHost;

declare class TextEncoder {
  encode(input?: string): Uint8Array;
}
