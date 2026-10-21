#!/usr/bin/env python3
"""TypeSafe JEV 的清单、当前商店条目与替换关系；不联网。"""

from pathlib import Path
import unittest

import yaml

from lib import _load_manifest_json

ROOT = Path(__file__).resolve().parents[1]
PLUGIN_ID = "com.jxmfkj.ai.ime.plugin.typesafe_jev"
OLD_ID = "com.jxmfkj.ai.ime.plugin.bocha_jev"


class TypeSafeJevIndexTest(unittest.TestCase):
    def setUp(self):
        self.manifest = _load_manifest_json((ROOT / "plugins/typesafe-jev/manifest.json").read_text())
        self.source = yaml.safe_load((ROOT / "src/plugins/v2" / f"{PLUGIN_ID}.yaml").read_text())
        self.entries = yaml.safe_load((ROOT / "plugins/v2/index.yaml").read_text())["plugins"]

    def test_manifest_and_source_agree_on_identity_and_capabilities(self):
        self.assertEqual(PLUGIN_ID, self.manifest["id"])
        self.assertEqual("TypeSafe 兼容 JEV", self.manifest["name"])
        for key in ("id", "name", "description", "icon", "activation", "minHostVersion", "platforms", "network", "capabilities"):
            self.assertEqual(self.manifest[key], self.source[key], key)
        self.assertEqual("jev", self.source["pluginType"])
        self.assertEqual({"allowCustomHosts": True}, self.source["network"])
        self.assertEqual(self.manifest["version"], self.source["currentVersion"])
        self.assertEqual(">=" + self.manifest["minHostVersion"], self.source["appVersion"])

    def test_published_entry_matches_source_with_real_package_metadata(self):
        entries = [entry for entry in self.entries if entry["id"] == PLUGIN_ID]
        self.assertEqual([self.source], entries)
        version = next(v for v in self.source["versions"] if v["version"] == self.source["currentVersion"])
        download, = version["downloadUrl"]
        self.assertTrue(download["url"].endswith(".mopk"))
        self.assertRegex(download["sha256"], r"^[0-9a-f]{64}$")
        self.assertGreater(download["sizeBytes"], 0)

    def test_old_plugin_is_removed_from_current_catalog_and_sources(self):
        self.assertNotIn(OLD_ID, [entry["id"] for entry in self.entries])
        self.assertFalse((ROOT / "src/plugins/v2" / f"{OLD_ID}.yaml").exists())
        self.assertFalse((ROOT / "plugins/bocha-jev").exists())


if __name__ == "__main__":
    unittest.main()
