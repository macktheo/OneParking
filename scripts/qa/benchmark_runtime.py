"""Read-only local HTTPS device/config benchmark. Does not scan cards or move the gate."""
from pathlib import Path
import concurrent.futures, json, ssl, statistics, time, urllib.request
root=Path(__file__).resolve().parents[2]
env=dict(line.split('=',1) for line in (root/'backend/.env').read_text(encoding='utf-8-sig').splitlines() if '=' in line and not line.startswith('#'))
ctx=ssl.create_default_context(cafile=str(root/'infra/certs/root-ca.pem'))
def sample(_):
    start=time.perf_counter()
    request=urllib.request.Request('https://127.0.0.1:8443/api/v1/device/config',headers={'Authorization':'Bearer '+env['DEVICE_TOKEN'],'Accept':'application/json'})
    try:
        with urllib.request.urlopen(request,context=ctx,timeout=8) as response:
            response.read(); status=response.status
    except OSError: status=0
    return {'ms':round((time.perf_counter()-start)*1000,1),'status':status}
sample(0)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: results=list(pool.map(sample,range(16)))
print(json.dumps({'samples':16,'parallel':4,'success':sum(x['status']==200 for x in results),'median_ms':statistics.median(x['ms'] for x in results),'max_ms':max(x['ms'] for x in results)}))
