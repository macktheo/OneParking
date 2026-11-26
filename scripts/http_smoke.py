import json,urllib.request,urllib.error,urllib.parse,http.cookiejar
from pathlib import Path
env=dict(line.split('=',1) for line in (Path(__file__).resolve().parents[1]/'backend/.env').read_text().splitlines() if '=' in line and not line.startswith('#'))
jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar));base='http://127.0.0.1:8000'
def call(path,method='GET',body=None,csrf=True):
 headers={'Accept':'application/json','Content-Type':'application/json'}
 if csrf:
  for cookie in jar:
   if cookie.name=='XSRF-TOKEN':headers['X-XSRF-TOKEN']=urllib.parse.unquote(cookie.value)
 req=urllib.request.Request(base+path,method=method,headers=headers,data=json.dumps(body).encode() if body is not None else None)
 try:
  with client.open(req,timeout=10) as r:return r.status,r.read().decode()
 except urllib.error.HTTPError as e:return e.code,e.read().decode()
assert call('/login')[0]==200
assert call('/login','POST',{'email':env['ADMIN_EMAIL'],'password':env['ADMIN_PASSWORD']},False)[0]==419
assert call('/sanctum/csrf-cookie')[0]==204
status,result=call('/login','POST',{'email':env['ADMIN_EMAIL'],'password':env['ADMIN_PASSWORD']});assert status==200,(status,result[:80])
assert call('/api/v1/admin/dashboard')[0]==200
assert call('/api/v1/admin/topup','POST',{},False)[0]==419
assert call('/api/v1/admin/topup','POST',{})[0]==422
assert call('/logout','POST',{})[0]==200
assert call('/api/v1/admin/dashboard')[0]==401
print('HTTP smoke PASS: halaman, CSRF419, login, dashboard, validasi422, logout, guest401 (9 checks).')
