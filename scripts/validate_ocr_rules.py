#!/usr/bin/env python3
"""校验索引精确字节与来源，调用固定来源 xipm 做 Schema/正则/fixture 校验。"""
import argparse
from datetime import datetime
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent.parent
BASE = 'https://index.ailaogong.men/'
REQUIRED = {'id', 'name', 'version', 'schemaVersion', 'minPluginVersion', 'match', 'url', 'sha256', 'sizeBytes', 'updatedAt'}
SEMVER = re.compile(r'\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?')


def verify_index(root: Path = ROOT) -> list[tuple[dict, Path]]:
    index = json.loads((root / 'rules/ocr-clean/index.yaml').read_text())
    if index.get('schemaVersion') != 1 or not isinstance(index.get('rules'), list) or not index['rules']:
        raise ValueError('规则索引无效')
    ids, paths, result = set(), set(), []
    for entry in index['rules']:
        if set(entry) != REQUIRED or not re.fullmatch(r'[A-Za-z0-9_.-]+', entry['id']) or entry['id'] in ids:
            raise ValueError('条目字段无效或 id 重复')
        if not SEMVER.fullmatch(entry['version']) or not SEMVER.fullmatch(entry['minPluginVersion']) or entry['schemaVersion'] != 1:
            raise ValueError('版本字段无效')
        relative = Path('rules/ocr-clean') / entry['id'] / (entry['version'] + '.json')
        if entry['url'] != BASE + relative.as_posix() or '..' in relative.parts:
            raise ValueError('规则 URL 与路径不一致')
        path = root / relative
        data = path.read_bytes()
        if not 0 < len(data) <= 1024 * 1024 or type(entry['sizeBytes']) is not int or len(data) != entry['sizeBytes'] or hashlib.sha256(data).hexdigest() != entry['sha256']:
            raise ValueError('规则大小或 SHA256 不一致：' + entry['id'])
        rule = json.loads(data)
        for field in ('id', 'name', 'version', 'schemaVersion', 'minPluginVersion'):
            if rule[field] != entry[field]:
                raise ValueError('索引元数据与规则不一致：' + field)
        match = {key: rule['match'][key] for key in ('packages', 'appVersion') if key in rule['match']}
        if entry['match'] != match:
            raise ValueError('match 与规则不一致')
        datetime.fromisoformat(entry['updatedAt'].replace('Z', '+00:00'))
        ids.add(entry['id']); paths.add(path.resolve()); result.append((entry, path))
    # 历史版本允许保留，但每个 JSON 都必须有有效的自述 id/version，不允许任意文件。
    for path in (root / 'rules/ocr-clean').glob('*/*.json'):
        rule = json.loads(path.read_bytes())
        if path.parent.name != rule['id'] or path.stem != rule['version']:
            raise ValueError('版本化文件路径无效')
    return result


def verify_upstream(upstream: Path, root: Path = ROOT) -> None:
    source = json.loads((root / 'tests/ocr-clean/upstream.json').read_text())
    schema = 'plugins/ocr-clean/schema/rule.schema.json'
    if schema not in source['files']:
        raise ValueError('缺少 Schema 来源')
    for name, expected in source['files'].items():
        path = Path(name)
        if path.is_absolute() or '..' in path.parts or not name.startswith('plugins/ocr-clean/'):
            raise ValueError('无效来源路径')
        if hashlib.sha256((upstream / path).read_bytes()).hexdigest() != expected:
            raise ValueError('来源 SHA256 不一致：' + name)
        if '/fixtures/' in name:
            local = root / 'tests/ocr-clean' / path.relative_to('plugins/ocr-clean/rules-src')
            if hashlib.sha256(local.read_bytes()).hexdigest() != expected:
                raise ValueError('fixture 来源不一致：' + name)


def validate(xipm: Path, upstream: Path, root: Path = ROOT) -> None:
    entries = verify_index(root)
    verify_upstream(upstream, root)
    with tempfile.TemporaryDirectory(prefix='xime-ocr-') as temporary:
        target = Path(temporary)
        # 验证每个对外版本，历史版本也不能悄悄失去 Schema/fixture 覆盖。
        for path in sorted((root / 'rules/ocr-clean').glob('*/*.json')):
            rule = json.loads(path.read_bytes())
            slug = rule['id'].rsplit('.', 1)[-1]
            output = target / rule['id'] / rule['version']
            output.mkdir(parents=True)
            shutil.copy2(path, output / 'rule.json')
            fixtures = root / 'tests/ocr-clean' / slug / 'fixtures'
            if not list(fixtures.glob('*.json')):
                raise ValueError('缺少 fixture：' + rule['id'])
            shutil.copytree(fixtures, output / 'fixtures')
        subprocess.run([str(xipm), 'rule', 'check', str(target)], check=True)
        subprocess.run([str(xipm), 'rule', 'test', str(target)], check=True)
    print(f'规则索引 {len(entries)} 项：字节、SHA256、Schema、来源和 fixtures 全部通过')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--xipm', required=True, type=Path)
    parser.add_argument('--upstream', required=True, type=Path)
    args = parser.parse_args()
    validate(args.xipm.resolve(), args.upstream.resolve())
