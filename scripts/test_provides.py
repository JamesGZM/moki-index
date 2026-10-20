#!/usr/bin/env python3
"""provides 规范化的合成数据检查。不访问网络，也不改索引。"""

import importlib.util
import io
import json
from pathlib import Path
import tempfile
from unittest.mock import patch
import zipfile

import yaml

from lib import apply_provides, normalize_provides, provides_from_zip_bytes


def zip_with_manifest(manifest: dict) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("manifest.json", json.dumps(manifest))
    return buf.getvalue()


def check_index_generation():
    spec = importlib.util.spec_from_file_location("ci_update", Path(__file__).with_name("ci-update.py"))
    ci = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ci)
    blob = zip_with_manifest({"provides": [{"id": "fixture.read", "version": 2}]})
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        src = root / "src/plugins/v2"
        src.mkdir(parents=True)
        originals = {}
        for pid in ("fixture.first", "fixture.second"):
            data = {
                "id": pid, "name": pid, "pluginType": "context", "currentVersion": "2.0.0",
                "versions": [
                    {"version": "1.0.0", "downloadUrl": [{"url": "https://example.invalid/old.xipk"}]},
                    {"version": "2.0.0", "downloadUrl": [{"url": "https://example.invalid/new.xipk"}]},
                ],
            }
            path = src / (pid + ".yaml")
            path.write_text(yaml.safe_dump(data), encoding="utf-8")
            originals[path] = path.read_bytes()
        with (
            patch.object(ci, "ROOT", directory),
            patch.object(ci, "SRC_DIR", str(root / "src")),
            patch("lib.download_bytes", return_value=blob) as fetch,
        ):
            ci.update_source("plugins/v2", "plugins/v2", "plugins", ci.PLUGIN_V2_FIELDS,
                             lambda data: data, ci.HEADERS["plugins/v2"], index_version=2)
        fetch.assert_called_once_with("https://example.invalid/new.xipk")
        index = yaml.safe_load((root / "plugins/v2/index.yaml").read_text(encoding="utf-8"))
        assert index["index_version"] == 2
        assert len(index["plugins"]) == 2
        for entry in index["plugins"]:
            assert entry["pluginType"] == "context"
            assert entry["provides"] == [{"id": "fixture.read", "version": 2}]
        assert all(path.read_bytes() == content for path, content in originals.items())


def main():
    assert normalize_provides(None) is None
    assert normalize_provides([]) is None
    derived = normalize_provides([
        {"id": " fixture.read ", "version": 1, "name": "合成", "methods": ["process"]},
        {"id": "fixture.read", "version": 9},
        {"id": "fixture.other", "version": "2", "callers": ["host"]},
        {"id": "", "version": 1},
        "bad",
    ])
    assert derived == [
        {"id": "fixture.read", "version": 1},
        {"id": "fixture.other", "version": 2},
    ]

    blob = zip_with_manifest({
        "id": "fixture.reader",
        "type": "tool",
        "provides": [{"id": "fixture.read", "version": 1, "reason": "合成"}],
    })
    assert provides_from_zip_bytes(blob) == [{"id": "fixture.read", "version": 1}]
    assert provides_from_zip_bytes(b"not-a-zip") is None

    inline = apply_provides({
        "currentVersion": "1.0.0",
        "provides": [{"id": "fixture.read", "version": 1, "methods": ["process"]}],
        "versions": [{"version": "1.0.0", "downloadUrl": [{"url": "https://example.invalid/a.xipk"}]}],
    }, fetch=lambda url: (_ for _ in ()).throw(AssertionError("已有 provides 时不应下载")))
    assert inline["provides"] == [{"id": "fixture.read", "version": 1}]

    fetched = apply_provides({
        "pluginType": "context",
        "currentVersion": "1.0.0",
        "versions": [{"version": "1.0.0", "downloadUrl": [{"url": "https://example.invalid/a.xipk"}]}],
    }, fetch=lambda url: blob)
    assert fetched["provides"] == [{"id": "fixture.read", "version": 1}]
    assert fetched["pluginType"] == "context"

    missing = apply_provides({
        "currentVersion": "1.0.0",
        "versions": [{"version": "1.0.0", "downloadUrl": [{"url": "https://example.invalid/a.xipk"}]}],
    }, fetch=lambda url: zip_with_manifest({"id": "fixture.plain", "type": "tool"}))
    assert "provides" not in missing

    failed = apply_provides({
        "currentVersion": "1.0.0",
        "versions": [{"version": "1.0.0", "downloadUrl": [{"url": "https://example.invalid/a.xipk"}]}],
    }, fetch=lambda url: (_ for _ in ()).throw(OSError("合成失败")))
    assert "provides" not in failed

    calls = []

    def counting_fetch(url):
        calls.append(url)
        return blob

    cache = {}
    first = {
        "currentVersion": "1.0.0",
        "versions": [{"version": "1.0.0", "downloadUrl": [
            {"url": "https://example.invalid/a.xipk", "sha256": "ABC"},
        ]}],
    }
    second = {
        "currentVersion": "1.0.0",
        "versions": [{"version": "1.0.0", "downloadUrl": [
            {"url": "https://example.invalid/b.xipk", "sha256": "abc"},
        ]}],
    }
    third = {
        "currentVersion": "1.0.0",
        "versions": [{"version": "1.0.0", "downloadUrl": [
            {"url": "https://example.invalid/a.xipk"},
        ]}],
    }
    assert apply_provides(first, fetch=counting_fetch, cache=cache)["provides"] == [{"id": "fixture.read", "version": 1}]
    assert apply_provides(second, fetch=counting_fetch, cache=cache)["provides"] == [{"id": "fixture.read", "version": 1}]
    assert apply_provides(third, fetch=counting_fetch, cache=cache)["provides"] == [{"id": "fixture.read", "version": 1}]
    assert calls == ["https://example.invalid/a.xipk"]
    check_index_generation()
    print("ok")


if __name__ == "__main__":
    main()
