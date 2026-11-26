from pathlib import Path
import json,os,ssl,socket,urllib.request,urllib.error,urllib.parse,http.cookiejar,datetime,uuid,time,statistics,subprocess
root=Path(__file__).resolve().parents[2];work=root/'work/qa';cfg=json.loads((work/'qa-private-env.json').read_text());base='https://127.0.0.1:8444'
assert cfg['DB_DATABASE']=='oneparking_http_test'
env=os.environ.copy();env.update({k:v for k,v in cfg.items() if k in ['APP_ENV','APP_DEBUG','APP_URL','DB_CONNECTION','DB_HOST','DB_PORT','DB_DATABASE','DB_USERNAME','DB_PASSWORD','ADMIN_EMAIL','ADMIN_PASSWORD','VIEWER_EMAIL','VIEWER_PASSWORD','DEVICE_TOKEN','SESSION_COOKIE','SESSION_SECURE_COOKIE','CACHE_STORE']})
ctx=ssl.create_default_context(cafile=str(root/'infra/certs/root-ca.pem'))
results=[]
def record(name,detail=''):
 results.append({'name':name,'status':'PASS','detail':detail});print('PASS:',name,flush=True)
class Client:
 def __init__(self):
  self.jar=http.cookiejar.CookieJar();self.opener=urllib.request.build_opener(urllib.request.HTTPSHandler(context=ctx),urllib.request.HTTPCookieProcessor(self.jar))
 def call(self,path,method='GET',payload=None,csrf=True,token=None):
  headers={'Accept':'application/json','Content-Type':'application/json'}
  if token:headers['Authorization']='Bearer '+token
  if csrf:
   for cookie in self.jar:
    if cookie.name=='XSRF-TOKEN':headers['X-XSRF-TOKEN']=urllib.parse.unquote(cookie.value)
  req=urllib.request.Request(base+path,method=method,headers=headers,data=None if payload is None else json.dumps(payload).encode())
  try:
   with self.opener.open(req,timeout=15) as res:status=res.status;body=res.read();content=res.headers.get('content-type','')
  except urllib.error.HTTPError as e:status=e.code;body=e.read();content=e.headers.get('content-type','')
  return status,json.loads(body) if 'json' in content and body else body.decode(errors='replace')
 def login(self,email,password):
  assert self.call('/sanctum/csrf-cookie')[0]==204
  status,data=self.call('/login','POST',{'email':email,'password':password});assert status==200,(status,data)
  return data
admin=Client();guest=Client();viewer=Client();device=Client();token=cfg['DEVICE_TOKEN']
def A(path,method='GET',p=None):return admin.call('/api/v1/admin/'+path,method,p)
def D(path,method='GET',p=None):return device.call('/api/v1/device/'+path,method,p,token=token)
def mode(value):
 status,data=A('devices/1/mode','PATCH',{'mode':value});assert status==200,(status,data)
 return D('config')[1]['mode_version']
def payload(uid,version,rid=None):return {'request_id':rid or str(uuid.uuid4()),'uid':uid,'mode_version':version,'scanned_at':datetime.datetime.now(datetime.timezone.utc).isoformat()}
def scan(uid,version,rid=None):return D('scan','POST',payload(uid,version,rid))
def claim():
 status,data=A('scan-claims','POST',{});assert status==200,(status,data);return data['claim_id']
def parallel(job,count=10):
 folder=work/('race-'+uuid.uuid4().hex);folder.mkdir();jobfile=folder/'job.json';jobfile.write_text(json.dumps(job));go=folder/'go';workers=[]
 for i in range(count):
  proc=subprocess.Popen(['php',str(root/'scripts/qa_parallel_worker.php'),str(jobfile),str(folder/('ready'+str(i))),str(go)],cwd=root/'backend',env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,creationflags=subprocess.CREATE_NO_WINDOW);workers.append(proc)
 deadline=time.monotonic()+20
 while len(list(folder.glob('ready*')))<count:
  assert time.monotonic()<deadline,'Parallel workers not ready';time.sleep(.03)
 go.touch();out=[]
 for proc in workers:
  stdout,stderr=proc.communicate(timeout=25);assert proc.returncode==0,(stdout,stderr);out.append(json.loads(stdout))
 return out
try:
 with urllib.request.urlopen(base+'/up',context=ctx) as res:assert res.status==200
 record('HTTPS valid CA and hostname')
 try:
  with urllib.request.urlopen(base+'/up',context=ssl.create_default_context()):pass
  raise AssertionError('Untrusted CA accepted')
 except urllib.error.URLError as e:assert isinstance(e.reason,ssl.SSLCertVerificationError)
 try:
  with socket.create_connection(('127.0.0.1',8444)) as sock:
   with ctx.wrap_socket(sock,server_hostname='wrong-host.invalid'):pass
  raise AssertionError('Wrong hostname accepted')
 except ssl.SSLCertVerificationError:pass
 record('Invalid CA and hostname rejected (TC27 software client)')
 assert guest.call('/api/v1/admin/topup','POST',{'amount':20000},csrf=False)[0]==401
 assert guest.call('/login','POST',{'email':cfg['ADMIN_EMAIL'],'password':cfg['ADMIN_PASSWORD']},csrf=False)[0]==419
 admin.login(cfg['ADMIN_EMAIL'],cfg['ADMIN_PASSWORD']);viewer.login(cfg['VIEWER_EMAIL'],cfg['VIEWER_PASSWORD'])
 assert viewer.call('/api/v1/admin/topup','POST',{'amount':20000})[0]==403
 assert A('dashboard')[0]==200
 assert admin.call('/api/v1/admin/topup','POST',{},csrf=False)[0]==419
 record('Real HTTPS login, guest401, viewer403 and authenticated CSRF419')
 version=mode('REGISTER');uid='0012ABCD'
 assert scan(uid,version)[1]['code']=='REGISTER_SCAN';registration_claim=claim()
 status,data=A('cards','POST',{'claim_id':registration_claim,'name':'QA <script>alert(1)</script>','student_number':'0001','vehicle_plate':'TEST 01'});assert status==200,(status,data);card_id=data['id'];assert data['balance']==0
 assert scan(uid,version)[0]==200;dup=claim();assert A('cards','POST',{'claim_id':dup,'name':'Duplicate','student_number':'0002','vehicle_plate':'TEST 02'})[0]==409
 record('RFID registration, leading zero and duplicate rejection (TC04 software)')
 second=Client();second.login(cfg['ADMIN_EMAIL'],cfg['ADMIN_PASSWORD'])
 scan('0012ACDC',version);session_claim=claim()
 status,_=second.call('/api/v1/admin/cards','POST',{'claim_id':session_claim,'name':'Wrong session','student_number':'0009','vehicle_plate':'NO'})
 assert status==422
 record('Scan confirmation bound to login session, including same admin')

 version=mode('TOPUP');assert scan(uid,version)[1]['gate_command'] is None;topup_claim=claim();request={'claim_id':topup_claim,'request_id':str(uuid.uuid4()),'amount':20000};actor=admin.call('/api/v1/auth/user')[1]['id']
 race=parallel({'operation':'topup','user_id':actor,'payload':request});assert all(x['balance_after']==20000 for x in race)
 assert A('topup','POST',request)[1]['balance_after']==20000
 conflict={**request,'amount':30000};assert A('topup','POST',conflict)[0]==409
 assert len(A('transactions?type=TOPUP')[1]['data'])==1
 record('10 concurrent MySQL top-ups + retry credit exactly once (TC12)')
 for amount in [0,-1,1.5,'abc','20000',True,1000001]:
  assert A('topup','POST',{'claim_id':topup_claim,'request_id':str(uuid.uuid4()),'amount':amount})[0]==422
 assert admin.call('/api/v1/admin/cards/'+str(card_id)+'/balance','PATCH',{'balance':999999})[0]==404
 record('Invalid amounts and direct balance edits rejected (TC10/11)')
 version=mode('ENTRY');p=payload(uid,version);entry_race=parallel({'operation':'scan','payload':p});assert all(x['code']=='ENTRY_SUCCESS' for x in entry_race);cmd=entry_race[0]['gate_command']['id'];assert len(set(x['gate_command']['id'] for x in entry_race))==1
 assert scan(uid,version)[1]['code']=='ALREADY_INSIDE'
 assert D('requests/'+p['request_id'])[1]['gate_command']['id']==cmd
 assert D('commands/'+cmd+'/ack','POST',{'status':'EXECUTED'})[0]==200
 assert D('commands/'+cmd+'/ack','POST',{'status':'CLOSED_COMMANDED'})[0]==200
 record('10 concurrent ENTRY retries, one session/command, reconciliation and ACK (TC13/14/20)')
 assert A('settings','PATCH',{'rate':9000,'topup_min':1000,'topup_max':1000000,'duration_ms':3000})[0]==200
 version=mode('EXIT');p=payload(uid,version);exit_race=parallel({'operation':'scan','payload':p});assert all(x['code']=='EXIT_SUCCESS' and x['fee']==2000 and x['balance_after']==18000 for x in exit_race)
 for _ in range(10):assert D('scan','POST',p)[1]['balance_after']==18000
 assert scan(uid,version)[1]['code']=='INVALID_SESSION'
 assert len(A('transactions?type=PARKING_PAYMENT')[1]['data'])==1
 record('10 concurrent EXIT + 10 retries: one debit and old tariff snapshot (TC18/29)')
 assert A('cards/'+str(card_id)+'/status','PATCH',{'status':'BLOCKED'})[0]==200
 assert scan(uid,version)[1]['code']=='BLOCKED_CARD';assert scan('DEADBEEF',version)[1]['code']=='UNKNOWN_CARD'
 assert A('cards/'+str(card_id)+'/status','PATCH',{'status':'ACTIVE'})[0]==200
 record('Unknown/blocked card rejection (TC05)')
 version=mode('REGISTER');empty_uid='00000001';scan(empty_uid,version);claim_id=claim();status,empty=A('cards','POST',{'claim_id':claim_id,'name':'QA Zero','student_number':'0003','vehicle_plate':'TEST 03'});assert status==200
 version=mode('ENTRY');scan(empty_uid,version);version=mode('EXIT');result=scan(empty_uid,version)[1];assert result['code']=='INSUFFICIENT_BALANCE' and result['gate_command'] is None
 assert any(x['card_id']==empty['id'] and x['status']=='ACTIVE' for x in A('parking')[1])
 record('Insufficient balance keeps active session and gate denied (TC17)')
 p=payload(uid,version-1);assert D('scan','POST',p)[0]==409
 p=payload(uid,version);p['scanned_at']=(datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(minutes=1)).isoformat();assert D('scan','POST',p)[0]==409
 assert device.call('/api/v1/device/config',token='wrong-token')[0]==401
 record('Stale mode/time and invalid device token rejected (TC21/22/24)')
 assert D('heartbeat','POST',{'gate_state':'COMMANDED_CLOSED','mode_version':version,'reader_ready':True,'rssi':-48,'sent_at':datetime.datetime.now(datetime.timezone.utc).isoformat()})[0]==200
 status,display=guest.call('/api/v1/display/status');assert status==200
 serialized=json.dumps(display);assert all(x not in serialized for x in [uid,'0001','QA <script>',token])
 assert A('transactions?status=REJECTED')[1]['total']>=3
 assert A('transactions/export?status=REJECTED')[0]==200
 assert A('audit-logs')[1]
 record('Sanitized live display, rejected history, CSV and audit (TC26)')
 samples=[]
 for _ in range(20):
  before=time.monotonic();assert scan('FACEB00C',version)[0]==200;samples.append((time.monotonic()-before)*1000)
 p95=sorted(samples)[18];assert p95<=2000,f'p95={p95}ms'
 record('20 TLS LAN-loopback scan latency samples (NFR01 software)',f'p95={p95:.1f}ms, mean={statistics.mean(samples):.1f}ms')
 done=subprocess.run(['php','artisan','parking:reconcile'],cwd=root/'backend',env=env,capture_output=True,text=True);assert done.returncode==0,done.stdout
 record('All QA card balances reconcile with ledger (TC30)')
 assert admin.call('/logout','POST',{})[0]==200;assert A('dashboard')[0]==401
 record('Logout invalidates session (TC06)')
 with urllib.request.urlopen('http://127.0.0.1:8086',timeout=10) as res:assert res.status==200 and 'phpMyAdmin' in res.read().decode(errors='replace')
 record('phpMyAdmin interface available on loopback8086')
finally:
 (work/'full-prd-api-results.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
print('API/TLS/parallel suite complete:',len(results),'checks passed. Physical ESP/RFID/servo not tested.',flush=True)
