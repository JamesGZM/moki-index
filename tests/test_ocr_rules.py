import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from validate_ocr_rules import ROOT, verify_index, verify_upstream
from build_worker_assets import build

class OcrIndexTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        shutil.copytree(ROOT / 'rules', self.root / 'rules')
        shutil.copy2(ROOT / 'index.yaml', self.root / 'index.yaml')
        self.index_path = self.root / 'rules/ocr-clean/index.yaml'
        self.index = json.loads(self.index_path.read_text())

    def tearDown(self):
        self.temp.cleanup()

    def mutate(self, field, value):
        self.index['rules'][0][field] = value
        self.index_path.write_text(json.dumps(self.index))
        with self.assertRaises(ValueError):
            verify_index(self.root)

    def test_exact_published_bytes_pass(self):
        self.assertEqual(3, len(verify_index(self.root)))

    def test_bad_sha_fails(self):
        self.mutate('sha256', '0' * 64)

    def test_truncated_size_fails(self):
        self.mutate('sizeBytes', 1)

    def test_metadata_mismatch_fails(self):
        self.mutate('name', '错误名称')

    def test_foreign_url_fails(self):
        self.mutate('url', 'https://example.test/rule.json')

    def test_worker_assets_exclude_fixtures_and_scripts(self):
        build(self.root)
        files = {str(p.relative_to(self.root / '.worker-assets')) for p in (self.root / '.worker-assets').rglob('*') if p.is_file()}
        self.assertEqual(5, len(files))
        self.assertTrue(all(p == 'index.yaml' or p.startswith('rules/ocr-clean/') for p in files))

if __name__ == '__main__':
    unittest.main()
