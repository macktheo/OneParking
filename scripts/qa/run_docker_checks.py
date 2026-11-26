"""Exercise the built Apache/PHP image against isolated QA databases, never production data."""
from pathlib import Path
import json, subprocess, sys, time, urllib.request

root = Path(__file__).resolve().parents[2]
work = root / 'work/qa'
container = 'oneparking-qa-app'

def run(args, cwd=root):
    subprocess.run(args, cwd=cwd, check=True)

try:
    if '--browser-only' not in sys.argv: run(['powershell', '-ExecutionPolicy', 'Bypass', '-File', str(root/'scripts/test-mysql.ps1')])
    run([sys.executable, str(root/'scripts/qa/start_runtime.py'), '--docker'])
    if '--browser-only' not in sys.argv: run([sys.executable, str(root/'scripts/qa/test_api.py')])
    run(['node', 'tests/Browser/live-prd.cjs'], root/'backend')
    print('PASS: Docker browser flows.' if '--browser-only' in sys.argv else 'PASS: actual Docker image, MySQL transactions/concurrency, verified TLS and browser flows.')
finally:
    subprocess.run(['docker', 'rm', '-f', container], capture_output=True)
    if (work/'qa-pids.json').exists():
        for pid in json.loads((work/'qa-pids.json').read_text()):
            subprocess.run(['taskkill', '/PID', str(pid), '/T', '/F'], capture_output=True)
