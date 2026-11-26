from pathlib import Path
import subprocess,json,time,sys
root=Path(__file__).resolve().parents[2]
qa=root/'scripts/qa';work=root/'work/qa';work.mkdir(parents=True,exist_ok=True)
def run(args,cwd=root):
 result=subprocess.run(args,cwd=cwd)
 if result.returncode:raise SystemExit(result.returncode)
try:
 run(['powershell','-ExecutionPolicy','Bypass','-File',str(root/'scripts/test-mysql.ps1')])
 run([sys.executable,str(qa/'start_runtime.py')])
 run([sys.executable,str(qa/'test_api.py')])
 run(['node','tests/Browser/live-prd.cjs'],root/'backend')
 print('PASS: automated backend, MySQL parallel, TLS, API and UI checks. Physical hardware still requires manual testing.')
finally:
 pids=work/'qa-pids.json'
 if pids.exists():
  for pid in json.loads(pids.read_text()):subprocess.run(['taskkill','/PID',str(pid),'/T','/F'],capture_output=True)
