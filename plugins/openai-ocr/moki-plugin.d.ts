/** 本插件用到的宿主类型。完整定义见 MfkjImeHelper tools/moki-plugin/templates/moki-plugin.d.ts。 */

declare class MokiError extends Error {
  readonly code: string;
  constructor(code: string, message: string);
}

declare function definePlugin<T extends MokiPluginSpec>(spec: T): T;

interface MokiPluginSpec {
  settings?: MokiSettingsExtension;
  ocr?: MokiOcrExtension;
}

interface MokiSettingsExtension {
  schema(): MokiUiNode[];
}

interface MokiUiNode {
  type: 'input' | 'secret' | 'textarea' | 'select' | 'multi_select' | 'switch' | 'number' | 'text' | 'section' | 'button';
  label?: string;
  key?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
}

interface MokiOcrBlock {
  text: string;
  bounds: [number, number, number, number];
}

interface MokiOcrResult {
  text: string;
  blocks: MokiOcrBlock[];
}

interface MokiOcrRequest {
  bytes: Uint8Array;
  mime: string;
  width: number;
  height: number;
  rotationDegrees: number;
  languageHint: string;
}

interface MokiOcrExtension {
  recognize(image: MokiOcrRequest): MokiOcrResult | Promise<MokiOcrResult>;
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
  readonly config: {
    get(key: string): string | null;
  };
  readonly crypto: {
    base64(data: Uint8Array): string;
  };
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
