#!/usr/bin/env python3
"""Moki 默认方案替换与生成索引一致性检查，不请求网络。"""

from pathlib import Path
import re
import unittest
import yaml

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return yaml.safe_load((ROOT / path).read_text(encoding="utf-8"))


class DefaultSchemeTest(unittest.TestCase):
    def test_default_is_the_moki_six_method_bundle(self):
        entry = read("src/rimes/builtin.yaml")
        self.assertEqual("builtin", entry["id"])
        self.assertEqual("默认方案", entry["name"])
        self.assertEqual("built-in", entry["type"])
        self.assertIn("Moki", entry["author"])
        for text in ["九宫格拼音", "全键盘拼音", "手写键盘", "笔画键盘", "五笔键盘", "双拼键盘"]:
            self.assertIn(text, entry["description"])
        self.assertIn("默认", entry["description"])

    def test_current_version_has_real_download_metadata_and_no_legacy_wubi_versions(self):
        entry = read("src/rimes/builtin.yaml")
        self.assertEqual([entry["currentVersion"]], [v["version"] for v in entry["versions"]])
        download = entry["versions"][0]["downloadUrl"][0]
        self.assertTrue(download["url"].startswith("https://github.com/JamesGZM/moki-index/releases/download/schemes-moki-default-"))
        self.assertTrue(download["url"].endswith(f"/moki-default-{entry['currentVersion']}-market.zip"))
        self.assertRegex(download["sha256"], re.compile(r"^[0-9a-f]{64}$"))
        self.assertGreater(download["sizeBytes"], 0)
        self.assertIn("模型由 App", entry["warning"])

    def test_generated_default_matches_source_and_old_author_records_are_archived(self):
        source = read("src/rimes/builtin.yaml")
        generated = read("rimes/index.yaml")["schemas"]
        self.assertEqual(source, next(item for item in generated if item["id"] == "builtin"))
        self.assertEqual("builtin", generated[0]["id"])
        old = read("archives/builtin-wubi.yaml")
        self.assertEqual("王永民", old["author"])
        self.assertIn("kingzcheung/rime-wubi", old["versions"][0]["downloadUrl"][0]["url"])

    def test_name_revision_keeps_the_version_and_previous_download(self):
        source = read("src/rimes/builtin.yaml")
        old = read("archives/builtin-before-names-0.0.1.yaml")
        self.assertEqual(old["currentVersion"], source["currentVersion"])
        self.assertEqual(old["appVersion"], source["appVersion"])
        self.assertNotEqual(old["versions"][0]["downloadUrl"], source["versions"][0]["downloadUrl"])
        self.assertEqual(["0.0.1"], [v["version"] for v in source["versions"]])

    def test_bundled_handwriting_model_uses_moki_requirements_without_changing_the_files(self):
        source = read("src/models/ochwpro.yaml")
        generated = next(x for x in read("models/index.yaml")["models"] if x["id"] == "ochwpro")
        self.assertEqual(">=0.0.1", source["appVersion"])
        self.assertEqual(source["appVersion"], generated["appVersion"])
        files = source["versions"][0]["files"]
        self.assertEqual(["ochwpro.onnx", "char_index.json"], [f["name"] for f in files])
        self.assertEqual([7001270, 51317], [f["sizeBytes"] for f in files])
        self.assertEqual(files, generated["versions"][0]["files"])


if __name__ == "__main__":
    unittest.main()
