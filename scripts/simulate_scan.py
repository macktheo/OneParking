import argparse,json,urllib.request,urllib.error,datetime,uuid,ssl
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser(description='Simulate ONE device tap against your local server');p.add_argument('uid');p.add_argument('--base',default='https://127.0.0.1:8443');args=p.parse_args()
if not args.base.startswith('https://'):raise SystemExit('HTTPS required; do not disable certificate validation.')
env=dict(l.split('=',1) for l in (root/'backend/.env').read_text(encoding='utf-8-sig').splitlines() if '=' in l and not l.startswith('#'))
context=ssl.create_default_context(cafile=str(root/'infra/certs/root-ca.pem'))
def call(path,payload=None):
 req=urllib.request.Request(args.base+'/api/v1/device'+path,headers={'Authorization':'Bearer '+env['DEVICE_TOKEN'],'Content-Type':'application/json','Accept':'application/json'},data=None if payload is None else json.dumps(payload).encode())
 try:
  with urllib.request.urlopen(req,context=context,timeout=10) as res:return json.load(res)
 except urllib.error.HTTPError as e:raise SystemExit('HTTP '+str(e.code)+': '+e.read().decode())
config=call('/config');call('/heartbeat',{'gate_state':'UNKNOWN','sent_at':datetime.datetime.now(datetime.timezone.utc).isoformat()})
result=call('/scan',{'request_id':str(uuid.uuid4()),'uid':args.uid.upper(),'mode_version':config['mode_version'],'scanned_at':datetime.datetime.now(datetime.timezone.utc).isoformat()})
print(json.dumps(result,indent=2));print('Scan simulator: no physical reader or servo involved.')
