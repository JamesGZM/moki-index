#!/usr/bin/env python3
"""方案／布局的Moki宿主版本与索引生成回归；不下载资源。"""

import importlib.util
from pathlib import Path
import re
import tempfile
import unittest
from unittest.mock import patch

import yaml

ROOT = Path(__file__).resolve().parents[1]
MIGRATED_RESOURCES = {
    "rimes": ("schemas", {
        "builtin", "cangjie", "luna_pinyin", "quick", "rime-frost", "rime-ice",
        "rime-wanxiang", "stroke", "wubi98", "wubixsj", "xqzm", "zhengma",
    }),
    "layouts": ("layouts", {
        "flypy", "msdouble", "no_bubble", "number_rows", "wubi_compact",
        "xime_flypy_proxy", "xime_index_net",
    }),
}


def read_yaml(path):
    return yaml.safe_load(path.read_text(encoding="utf-8"))


class ResourceVersionTest(unittest.TestCase):
    def test_migrated_resources_are_available_to_moki_0_0_1(self):
        for directory, (_, ids) in MIGRATED_RESOURCES.items():
            for resource_id in sorted(ids):
                with self.subTest(directory=directory, resource=resource_id):
                    source = read_yaml(ROOT / "src" / directory / f"{resource_id}.yaml")
                    match = re.fullmatch(r">=\s*(\d+)\.(\d+)\.(\d+)", source["appVersion"])
                    self.assertIsNotNone(match, source["appVersion"])
                    minimum = tuple(int(part) for part in match.groups())
                    self.assertLessEqual(minimum, (0, 0, 1), source["appVersion"])

    def test_published_requirements_match_source(self):
        for directory, (key, _) in MIGRATED_RESOURCES.items():
            sources = {read_yaml(path)["id"]: read_yaml(path)["appVersion"]
                       for path in (ROOT / "src" / directory).glob("*.yaml")}
            published = {entry["id"]: entry["appVersion"]
                         for entry in read_yaml(ROOT / directory / "index.yaml")[key]}
            self.assertEqual(sources, published, directory)

    def test_generator_preserves_individual_moki_requirements(self):
        spec = importlib.util.spec_from_file_location("ci_update", ROOT / "scripts/ci-update.py")
        ci = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(ci)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with patch.object(ci, "ROOT", directory), patch.object(ci, "SRC_DIR", str(root / "src")):
                for group, (key, _) in MIGRATED_RESOURCES.items():
                    source_dir = root / "src" / group
                    source_dir.mkdir(parents=True)
                    for resource_id, requirement in [("current", ">=0.0.1"), ("future", ">=0.0.2")]:
                        (source_dir / f"{resource_id}.yaml").write_text(yaml.safe_dump({
                            "id": resource_id, "name": resource_id, "appVersion": requirement,
                            "currentVersion": "1.0.0", "versions": [],
                        }), encoding="utf-8")
                    fields = ci.SCHEMA_FIELDS if group == "rimes" else ci.LAYOUT_FIELDS
                    ci.update_source(group, group, key, fields, lambda data: data, ci.HEADERS[group])
                    published = read_yaml(root / group / "index.yaml")[key]
                    self.assertEqual({"current": ">=0.0.1", "future": ">=0.0.2"},
                                     {entry["id"]: entry["appVersion"] for entry in published})


if __name__ == "__main__":
    unittest.main()
