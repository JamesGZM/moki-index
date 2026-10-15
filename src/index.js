/**
 * Xime Index Worker
 * 代理 GitHub raw 文件，添加正确的 Content-Type 和 CORS 头
 */

// 生产环境默认的 GitHub raw 基地址
const DEFAULT_GITHUB_RAW = "https://raw.githubusercontent.com/JamesGZM/xime-index/main";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let path = url.pathname;

    // 根路径默认返回 index.yaml
    if (path === "/") {
      path = "/index.yaml";
    }

    // 本仓版本化规则直接由静态目录提供，未命中时不回退远程。
    if (path === "/index.yaml" || path.startsWith("/rules/")) {
      const allowed = path === "/index.yaml" || path === "/rules/ocr-clean/index.yaml" ||
        /^\/rules\/ocr-clean\/[A-Za-z0-9_.-]+\/[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?(?:\+[A-Za-z0-9.-]+)?\.json$/.test(path);
      if (!allowed) return new Response("Not Found", { status: 404 });
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: {
        "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      } });
      if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD, OPTIONS" } });
      const target = new URL(request.url); target.pathname = path;
      const asset = await env.ASSETS.fetch(new Request(target, request));
      const headers = new Headers(asset.headers);
      headers.set("Access-Control-Allow-Origin", "*");
      if (asset.ok) {
        headers.set("Content-Type", path.endsWith(".json") ? "application/json; charset=utf-8" : "text/yaml; charset=utf-8");
        headers.set("Cache-Control", path.endsWith(".json") ? "public, max-age=31536000, immutable" : "public, max-age=300");
      }
      return new Response(request.method === "HEAD" ? null : asset.body, { status: asset.status, headers });
    }

    // 只允许访问 .yaml 文件
    if (!path.endsWith(".yaml")) {
      return new Response("Not Found", { status: 404 });
    }

    // dev 模式下走 env 定义的 GitHub raw 基地址，否则使用生产默认值
    const baseUrl =
      env.ENV === "dev" && env.GITHUB_RAW_URL
        ? env.GITHUB_RAW_URL
        : DEFAULT_GITHUB_RAW;

    // 从 GitHub raw 获取文件
    const githubRaw = `${baseUrl}${path}`;
    const response = await fetch(githubRaw);

    if (!response.ok) {
      return new Response("Not Found", { status: 404 });
    }

    const content = await response.text();

    return new Response(content, {
      headers: {
        "Content-Type": "text/yaml; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=600",
      },
    });
  },
};
