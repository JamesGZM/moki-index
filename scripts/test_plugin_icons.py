#!/usr/bin/env python3
"""商店图片元数据与生成回归；--check-urls 额外验证远程 PNG。"""

import argparse
import hashlib
import importlib.util
from pathlib import Path
import re
import struct
import tempfile
from unittest.mock import patch
from urllib.parse import urlsplit
from urllib.request import urlopen

import yaml

from lib import ROOT


def load_ci():
    spec = importlib.util.spec_from_file_location("ci_update", Path(__file__).with_name("ci-update.py"))
    ci = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ci)
    return ci


def check_generation():
    ci = load_ci()
    fixtures = [
        {"id": "fixture.image", "icon": "icon-v2.png", "iconUrl": "https://example.com/icon-v2.png"},
        {"id": "fixture.text", "icon": "译"},
        {"id": "fixture.empty"},
    ]
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        src = root / "src/plugins/v2"
        src.mkdir(parents=True)
        for item in fixtures:
            item.update({"name": item["id"], "pluginType": "tool"})
            (src / (item["id"] + ".yaml")).write_text(yaml.safe_dump(item), encoding="utf-8")
        with patch.object(ci, "ROOT", directory), patch.object(ci, "SRC_DIR", str(root / "src")):
            ci.update_source("plugins/v2", "plugins/v2", "plugins", ci.PLUGIN_V2_FIELDS,
                             lambda data: data, ci.HEADERS["plugins/v2"], index_version=2)
        generated = yaml.safe_load((root / "plugins/v2/index.yaml").read_text())["plugins"]
        assert {p["id"]: p for p in generated} == {p["id"]: p for p in fixtures}
    print("OK: generation preserves image, legacy text and missing icons")


def check_catalog(check_urls=False):
    root = Path(ROOT)
    sources = [yaml.safe_load(p.read_text()) for p in sorted((root / "src/plugins/v2").glob("*.yaml"))]
    generated = {p["id"]: p for p in yaml.safe_load((root / "plugins/v2/index.yaml").read_text())["plugins"]}
    image_count = 0
    for entry in sources:
        pid = entry["id"]
        assert generated[pid].get("icon", "") == entry.get("icon", ""), pid
        assert generated[pid].get("iconUrl", "") == entry.get("iconUrl", ""), pid
        icon = entry.get("icon", "")
        url = entry.get("iconUrl", "")
        if re.search(r"\.(png|jpe?g|gif|webp|svg)$", icon, re.IGNORECASE):
            assert url, pid + ": image icon needs iconUrl"
        if not url:
            continue
        parts = urlsplit(url)
        assert parts.scheme == "https" and parts.hostname and not parts.username, pid
        assert not (parts.hostname == "raw.githubusercontent.com" and parts.path.startswith("/JamesGZM/Moki/")), pid + ": private source is not public"
        prefix = "/JamesGZM/moki-index/main/plugins/v2/icons/"
        if parts.hostname == "raw.githubusercontent.com" and parts.path.startswith(prefix):
            relative = Path(parts.path.removeprefix("/JamesGZM/moki-index/main/"))
            assert relative.parent.as_posix() == "plugins/v2/icons/" + pid, pid
            assert re.fullmatch(r"[0-9a-f]{64}\.png", relative.name), pid + ": use content hash path"
            content = (root / relative).read_bytes()
            assert hashlib.sha256(content).hexdigest() == relative.stem, pid + ": image hash mismatch"
            assert content[:8] == b"\x89PNG\r\n\x1a\n", pid
            assert struct.unpack(">II", content[16:24]) == (256, 256), pid
        image_count += 1
        if check_urls:
            with urlopen(url, timeout=30) as response:
                content = response.read()
                assert response.status == 200, pid
            assert content[:8] == b"\x89PNG\r\n\x1a\n", pid + ": URL is not a PNG"
            assert struct.unpack(">II", content[16:24]) == (256, 256), pid
            print(f"OK: {pid} remote 256x256 PNG sha256={hashlib.sha256(content).hexdigest()}")
    assert image_count > 0
    print(f"OK: {len(sources)} entries, {image_count} image URLs, source/generated metadata match")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check-urls", action="store_true")
    args = parser.parse_args()
    check_generation()
    check_catalog(args.check_urls)
