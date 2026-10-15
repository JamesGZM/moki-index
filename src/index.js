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
