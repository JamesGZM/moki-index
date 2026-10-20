"""
共享工具库 — 供各构建子脚本调用。
"""

import glob
import hashlib
import os
import tempfile
import urllib.request

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_VERSIONS = {"master", "main"}
USER_AGENT = "Xime-Index-Checksum/1.0"


def human_size(bytes_val: int) -> str:
    if bytes_val < 1024:
        return f"{bytes_val} B"
    elif bytes_val < 1024 * 1024:
        return f"{bytes_val / 1024:.1f} KB"
    elif bytes_val < 1024 * 1024 * 1024:
        return f"{bytes_val / (1024 * 1024):.1f} MB"
    else:
        return f"{bytes_val / (1024 * 1024 * 1024):.2f} GB"


def download_checksum(url: str):
    """下载文件，返回 (sha256_hex, size_bytes, size_human)。"""
    tmp_path = None
    try:
        fd, tmp_path = tempfile.mkstemp()
        os.close(fd)
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=300) as resp:
            sha256 = hashlib.sha256()
            size_bytes = 0
            while True:
                chunk = resp.read(65536)
                if not chunk:
                    break
                sha256.update(chunk)
                size_bytes += len(chunk)
        return sha256.hexdigest(), size_bytes, human_size(size_bytes)
    except Exception as exc:
        print(f"    ⚠ 下载失败: {exc}")
        return None, None, None
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


def should_skip_version(version: str) -> bool:
    return version.strip().strip('"').strip("'") in SKIP_VERSIONS


def load_yaml(path):
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def dump_yaml(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        yaml.dump(data, f, allow_unicode=True, default_flow_style=False, sort_keys=False)


def fill_download_urls(data: dict) -> dict:
    """
    补全 data 中 downloadUrl 列表内缺失的 sha256/size/sizeBytes。
    跳过 version 为 master/main 的版本。
    返回新的 dict（深拷贝），不修改入参。
    """
    import copy
    result = copy.deepcopy(data)

    for v in result.get("versions", []):
        ver = v.get("version", "?")
        if should_skip_version(ver):
            continue

        for dl in v.get("downloadUrl", []):
            url = dl.get("url", "")
            if not url or (dl.get("sha256") and dl.get("size")):
                continue
            # 跳过 .gram 文件，不生成 sha256
            if url.endswith(".gram"):
                print(f"  ⏭ {url} (.gram 文件，跳过 sha256)")
                continue
            print(f"  ↓ {url}")
            sha256, size_bytes, size_h = download_checksum(url)
            if sha256:
                dl["sha256"] = sha256
                dl["size"] = size_h
                dl["sizeBytes"] = size_bytes
                print(f"    ✓ sha256={sha256[:16]}...  size={size_h}  bytes={size_bytes}")

    return result


def fill_archive(data: dict) -> dict:
    """
    补全 data 中 archive 块缺失的 sha256/size/sizeBytes。
    跳过 version 为 master/main 的版本。
    """
    import copy
    result = copy.deepcopy(data)

    for v in result.get("versions", []):
        ver = v.get("version", "?")
        if should_skip_version(ver):
            continue

        if "archive" in v:
            a = v["archive"]
            url = a.get("url", "")
            if url and (not a.get("sha256") or not a.get("size")):
                print(f"  ↓ {url}")
                sha256, size_bytes, size_h = download_checksum(url)
                if sha256:
                    a["sha256"] = sha256
                    a["size"] = size_h
                    a["sizeBytes"] = size_bytes
                    print(f"    ✓ sha256={sha256[:16]}...  size={size_h}  bytes={size_bytes}")

    return result


def fill_files_checksums(data: dict) -> dict:
    """
    补全 data 中 files 列表内缺失的 sha256/size/sizeBytes。
    跳过 version 为 master/main 的版本。
    """
    import copy
    result = copy.deepcopy(data)

    for v in result.get("versions", []):
        ver = v.get("version", "?")
        if should_skip_version(ver):
            continue

        for f_item in v.get("files", []):
            url = f_item.get("url", "")
            if not url or (f_item.get("sha256") and f_item.get("size")):
                continue
            print(f"  ↓ {url}")
            sha256, size_bytes, size_h = download_checksum(url)
            if sha256:
                f_item["sha256"] = sha256
                f_item["size"] = size_h
                f_item["sizeBytes"] = size_bytes
                print(f"    ✓ sha256={sha256[:16]}...  size={size_h}  bytes={size_bytes}")

    return result


def normalize_provides(raw):
    """把 manifest.provides 收成 [{id, version}]。缺字段、空列表或无法识别时返回 None。"""
    if not isinstance(raw, list):
        return None
    out = []
    seen = set()
    for item in raw:
        if not isinstance(item, dict):
            continue
        pid = item.get("id")
        if not isinstance(pid, str):
            continue
        pid = pid.strip()
        if not pid or pid in seen:
            continue
        version = item.get("version", 1)
        if isinstance(version, str) and version.strip().isdigit():
            version = int(version.strip())
        if isinstance(version, bool) or not isinstance(version, int) or version <= 0:
            continue
        seen.add(pid)
        out.append({"id": pid, "version": version})
    return out or None


def _load_manifest_json(text: str):
    import json
    import re
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        stripped = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
        stripped = re.sub(r"(^|\s)//.*?$", "", stripped, flags=re.M)
        stripped = re.sub(r",(\s*[}\]])", r"\1", stripped)
        return json.loads(stripped)


def provides_from_zip_bytes(blob: bytes):
    """从 xipk（zip）里的 manifest.json 读取 provides。没有或解析失败时返回 None。"""
    import io
    import zipfile
    try:
        with zipfile.ZipFile(io.BytesIO(blob)) as zf:
            names = [
                name for name in zf.namelist()
                if name.endswith("manifest.json") and not name.startswith("__MACOSX")
            ]
            if not names:
                return None
            names.sort(key=lambda name: (name.count("/"), len(name)))
            text = zf.read(names[0]).decode("utf-8")
        manifest = _load_manifest_json(text)
    except Exception:
        return None
    if not isinstance(manifest, dict):
        return None
    return normalize_provides(manifest.get("provides"))


def current_xipk_download(data: dict):
    """当前版本里第一个 .xipk 下载项。没有时返回 None。"""
    current = str(data.get("currentVersion") or "")
    versions = data.get("versions") or []
    chosen = next((item for item in versions if str(item.get("version")) == current), None)
    if chosen is None and versions:
        chosen = versions[0]
    if not isinstance(chosen, dict):
        return None
    for download in chosen.get("downloadUrl") or []:
        if not isinstance(download, dict):
            continue
        url = download.get("url") or ""
        if str(url).endswith(".xipk"):
            return download
    return None


def current_xipk_url(data: dict):
    download = current_xipk_download(data)
    if not download:
        return None
    return download.get("url") or None


def _manifest_cache_get(cache, sha: str, url: str):
    if cache is None:
        return None, False
    if sha and ("sha", sha) in cache:
        return cache[("sha", sha)], True
    if url and ("url", url) in cache:
        return cache[("url", url)], True
    return None, False


def _manifest_cache_put(cache, sha: str, url: str, provides):
    if cache is None:
        return
    if sha:
        cache[("sha", sha)] = provides
    if url:
        cache[("url", url)] = provides


def download_bytes(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def derive_provides(data: dict, fetch=None, cache=None):
    """
    优先使用源 YAML 里已经写好的 provides（允许是 manifest 的完整对象）。
    没有时读取当前版本 xipk 的 manifest.provides。失败或未声明则返回 None，不中断生成。
    cache 以包的 sha256 和 url 记住已经解析出的 provides，同一次生成里不重复下载。
    """
    inline = normalize_provides(data.get("provides"))
    if inline:
        return inline
    download = current_xipk_download(data)
    if not download:
        return None
    url = str(download.get("url") or "")
    sha = str(download.get("sha256") or "").strip().lower()
    cached, hit = _manifest_cache_get(cache, sha, url)
    if hit:
        return cached
    if not url:
        return None
    if fetch is None:
        fetch = download_bytes
    try:
        blob = fetch(url)
    except Exception as exc:
        print(f"    ⚠ 未能下载插件包以读取 provides: {exc}")
        _manifest_cache_put(cache, sha, url, None)
        return None
    result = None
    if blob:
        try:
            result = provides_from_zip_bytes(blob)
        except Exception as exc:
            print(f"    ⚠ 未能从插件包读取 provides: {exc}")
    _manifest_cache_put(cache, sha, url, result)
    return result


def apply_provides(data: dict, fetch=None, cache=None) -> dict:
    """返回带规范化 provides 的副本；没有可用来源时去掉该字段。"""
    import copy
    result = copy.deepcopy(data)
    derived = derive_provides(result, fetch=fetch, cache=cache)
    if derived:
        result["provides"] = derived
    else:
        result.pop("provides", None)
    return result


def recalc_model_size(data: dict) -> dict:
    """
    重新计算模型级 size = 所有版本中所有文件 sizeBytes 的总和。
    仅在 sizeBytes 齐全时生效。
    """
    import copy
    result = copy.deepcopy(data)

    total_bytes = 0
    has_all = True
    for v in result.get("versions", []):
        for f in v.get("files", []):
            sb = f.get("sizeBytes")
            if sb is None:
                has_all = False
            else:
                total_bytes += sb

    if has_all and total_bytes > 0:
        old = result.get("size")
        new = human_size(total_bytes)
        result["size"] = new
        if old != new:
            print(f"    📐 模型大小: {old} → {new}")

    return result
