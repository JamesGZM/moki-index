#!/usr/bin/env python3
"""只打包公开主索引与 OCR 规则，供 Wrangler assets 提供服务。"""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent.parent

def build(root: Path = ROOT) -> None:
    out = root / '.worker-assets'
    if out.exists():
        shutil.rmtree(out)
    (out / 'rules' / 'ocr-clean').mkdir(parents=True)
    shutil.copy2(root / 'index.yaml', out / 'index.yaml')
    shutil.copy2(root / 'rules/ocr-clean/index.yaml', out / 'rules/ocr-clean/index.yaml')
    for path in sorted((root / 'rules/ocr-clean').glob('*/*.json')):
        target = out / path.relative_to(root)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)

if __name__ == '__main__':
    build()
