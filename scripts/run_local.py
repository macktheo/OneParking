from pathlib import Path
import subprocess,ssl,urllib.request,sys,time,json
root=Path(__file__).resolve().parents[1];work=root/'work/runtime';work.mkdir(parents=True,exist_ok=True)
command=['docker','compose','--project-name','oneparking','--env-file',str(root/'infra/.env'),'-f',str(root/'infra/compose.yaml'),'up','-d','--wait']
subprocess.run(command,check=True)
ctx=ssl.create_default_context(cafile=str(root/'infra/certs/root-ca.pem'))
try:
 with urllib.request.urlopen('https://127.0.0.1:8443/up',context=ctx,timeout=3) as res:
  if res.status==200:print('CampusPay already running: https://127.0.0.1:8443/login | phpMyAdmin http://127.0.0.1:8086');raise SystemExit(0)
except (OSError,urllib.error.URLError):pass
children=[]
try:
 for name,args,cwd in [('https',[sys.executable,str(root/'scripts/https_proxy.py'),'--bind','0.0.0.0','--port','8443'],root)]:
  stream=open(work/(name+'.log'),'w',encoding='utf-8');children.append(subprocess.Popen(args,cwd=cwd,stdout=stream,stderr=stream,creationflags=subprocess.CREATE_NO_WINDOW))
 (work/'pids.json').write_text(json.dumps([p.pid for p in children]))
 print('CampusPay running: https://127.0.0.1:8443/login | phpMyAdmin http://127.0.0.1:8086. Ctrl+C stops HTTPS; Docker app/database remain available.',flush=True)
 while all(p.poll() is None for p in children):time.sleep(1)
except KeyboardInterrupt:pass
finally:
 for p in children:subprocess.run(['taskkill','/PID',str(p.pid),'/T','/F'],capture_output=True)
