"""Local HTTPS reverse proxy for CampusPay LAN prototype (HTTP/1.1)."""
import argparse,http.server,http.client,ssl,sys,socket
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=8443);p.add_argument('--upstream',type=int,default=8000);p.add_argument('--bind',default='127.0.0.1');a=p.parse_args()
root=Path(__file__).resolve().parents[1]
hop={'connection','keep-alive','proxy-authenticate','proxy-authorization','te','trailers','transfer-encoding','upgrade','server','date'}
class Proxy(http.server.BaseHTTPRequestHandler):
 protocol_version='HTTP/1.1'
 def bridge(self):
  if self.headers.get('Transfer-Encoding'):
   self.send_error(400);return
  size=int(self.headers.get('Content-Length','0'))
  if size>2*1024*1024:self.send_error(413);return
  body=self.rfile.read(size) if size else None
  headers={k:v for k,v in self.headers.items() if k.lower() not in hop|{'x-forwarded-for','x-forwarded-proto','x-forwarded-host'}}
  headers['X-Forwarded-For']=self.client_address[0];headers['X-Forwarded-Proto']='https';headers['X-Forwarded-Host']=self.headers.get('Host','localhost')
  conn=http.client.HTTPConnection('127.0.0.1',a.upstream,timeout=15)
  try:
   conn.request(self.command,self.path,body,headers);res=conn.getresponse();data=res.read();self.send_response(res.status)
   for k,v in res.getheaders():
    if k.lower() not in hop|{'content-length'}:self.send_header(k,v)
   self.send_header('Content-Length',str(len(data)));self.send_header('X-Content-Type-Options','nosniff');self.send_header('Referrer-Policy','same-origin');self.end_headers()
   if self.command!='HEAD':self.wfile.write(data)
  except (OSError,http.client.HTTPException):
   data=b'{"message":"Upstream unavailable"}';self.send_response(503);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
  finally:conn.close()
 do_GET=bridge;do_HEAD=bridge;do_POST=bridge;do_PATCH=bridge;do_PUT=bridge;do_DELETE=bridge;do_OPTIONS=bridge
 def log_message(self,*args):pass # No URL, credentials or request body logs.
class TLSServer(http.server.ThreadingHTTPServer):
 address_family=socket.AF_INET6 if ':' in a.bind else socket.AF_INET
 daemon_threads=True
 request_queue_size=64
 def finish_request(self,request,client_address):
  # Handshake in the connection's worker, never in the listening/accept thread.
  # An ESP reset or idle TCP probe must not block all dashboard/device traffic.
  request.settimeout(10)
  try:
   with ctx.wrap_socket(request,server_side=True) as tls:
    super().finish_request(tls,client_address)
  except (ssl.SSLError,TimeoutError,ConnectionError):pass
ctx=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER);ctx.minimum_version=ssl.TLSVersion.TLSv1_2;ctx.load_cert_chain(root/'infra/certs/server.pem',root/'infra/certs/server-key.pem')
server=TLSServer((a.bind,a.port),Proxy)
print(f'CampusPay HTTPS ready: port {a.port}, upstream loopback {a.upstream}',flush=True)
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
