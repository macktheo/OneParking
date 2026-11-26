from pathlib import Path
import os,json,secrets,subprocess,time,urllib.request,ssl,sys
r=Path(__file__).resolve().parents[2];work=r/'work/qa';work.mkdir(parents=True,exist_ok=True)
def readenv(p):return dict(l.split('=',1) for l in p.read_text(encoding='utf-8-sig').splitlines() if '=' in l and not l.startswith('#'))
env=os.environ.copy();db=readenv(r/'infra/.env');env.update({'APP_ENV':'qa','APP_DEBUG':'false','APP_URL':'https://localhost:8444','DB_CONNECTION':'mysql','DB_HOST':'127.0.0.1','DB_PORT':'13307','DB_DATABASE':'oneparking_http_test','DB_USERNAME':'oneparking','DB_PASSWORD':db['MYSQL_PASSWORD'],'ADMIN_EMAIL':'admin.qa@oneparking.test','ADMIN_PASSWORD':secrets.token_urlsafe(24),'VIEWER_EMAIL':'viewer.qa@oneparking.test','VIEWER_PASSWORD':secrets.token_urlsafe(24),'DEVICE_TOKEN':secrets.token_hex(32),'SESSION_COOKIE':'oneparking_qa_session','SESSION_SECURE_COOKIE':'true','CACHE_STORE':'database'})
assert env['DB_DATABASE']=='oneparking_http_test'
(work/'qa-private-env.json').write_text(json.dumps({k:env[k] for k in ['APP_ENV','APP_DEBUG','APP_URL','DB_CONNECTION','DB_HOST','DB_PORT','DB_DATABASE','DB_USERNAME','DB_PASSWORD','ADMIN_EMAIL','ADMIN_PASSWORD','VIEWER_EMAIL','VIEWER_PASSWORD','DEVICE_TOKEN','SESSION_COOKIE','SESSION_SECURE_COOKIE','CACHE_STORE']}),encoding='utf-8')
for args in [['php','artisan','migrate:fresh','--force'],['php','artisan','db:seed','--force']]:
 done=subprocess.run(args,cwd=r/'backend',env=env,capture_output=True,text=True)
 if done.returncode:print(done.stdout,done.stderr);raise SystemExit(done.returncode)
handles=[]
upstream=8011
if '--docker' in sys.argv:
 private_env=readenv(r/'backend/.env');private_env.update(json.loads((work/'qa-private-env.json').read_text()));assert private_env['DB_DATABASE']=='oneparking_http_test'
 private_env.update(DB_HOST='mysql',DB_PORT='3306',APP_TRUSTED_PROXIES='127.0.0.1,::1,172.16.0.0/12',LOG_CHANNEL='stderr')
 private_path=work/'docker-qa.env';private_path.write_text('\n'.join(k+'='+str(v) for k,v in private_env.items())+'\n',encoding='utf-8')
 subprocess.run(['docker','run','--rm','-d','--name','oneparking-qa-app','--network','oneparking_default','-p','127.0.0.1:8012:80','--env-file',str(private_path),'oneparking-app:local'],check=True)
 upstream=8012
commands=[] if '--docker' in sys.argv else [('qa-php',['php','artisan','serve','--host=127.0.0.1','--port=8011','--no-reload'],r/'backend')]
commands.append(('qa-https',['python',str(r/'scripts/https_proxy.py'),'--port','8444','--upstream',str(upstream)],r))
for name,args,cwd in commands:
 log=open(work/(name+'.log'),'w',encoding='utf-8');p=subprocess.Popen(args,cwd=cwd,env=env,stdout=log,stderr=log,creationflags=subprocess.CREATE_NO_WINDOW);handles.append(p.pid)
(work/'qa-pids.json').write_text(json.dumps(handles))
ctx=ssl.create_default_context(cafile=str(r/'infra/certs/root-ca.pem'))
for _ in range(30):
 try:
  with urllib.request.urlopen('https://127.0.0.1:8444/up',context=ctx,timeout=2) as response:
   if response.status==200:break
 except Exception:time.sleep(.3)
else:raise SystemExit('QA startup failed; see private logs in work/.')
print('Isolated MySQL QA database and certificate-verified HTTPS runtime ready on localhost:8444.')
