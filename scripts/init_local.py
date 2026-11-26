"""Generate private local configuration without printing credentials."""
from pathlib import Path
import datetime,ipaddress,json,re,secrets,socket
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes,serialization
from cryptography.hazmat.primitives.asymmetric import rsa
root=Path(__file__).resolve().parents[1]
def values(p):return dict(l.split('=',1) for l in p.read_text(encoding='utf-8-sig').splitlines() if '=' in l and not l.startswith('#')) if p.exists() else {}
def save(p,data):
 text=p.read_text(encoding='utf-8-sig') if p.exists() else ''
 for k,v in data.items():
  pattern=r'(?m)^'+re.escape(k)+r'=.*$'
  if re.search(pattern,text):text=re.sub(pattern,lambda _:k+'='+str(v),text)
  else:text+='\n'+k+'='+str(v)
 p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text.strip()+'\n',encoding='utf-8')
db=values(root/'infra/.env')
for k in ['MYSQL_PASSWORD','MYSQL_ROOT_PASSWORD']:db[k]=db.get(k) or secrets.token_hex(24)
save(root/'infra/.env',db)
envfile=root/'backend/.env'
if not envfile.exists():envfile.write_text((root/'backend/.env.example').read_text(),encoding='utf-8')
env=values(envfile)
try:
 sock=socket.socket(socket.AF_INET,socket.SOCK_DGRAM);sock.connect(('1.1.1.1',80));host=sock.getsockname()[0];sock.close()
except OSError:host='127.0.0.1'
token=env.get('DEVICE_TOKEN') or secrets.token_hex(32)
save(envfile,{'APP_NAME':'CampusPay','APP_DEBUG':'false','APP_URL':f'https://{host}:8443','DB_CONNECTION':'mysql','DB_HOST':'127.0.0.1','DB_PORT':'13307','DB_DATABASE':'oneparking','DB_USERNAME':'oneparking','DB_PASSWORD':db['MYSQL_PASSWORD'],'ADMIN_EMAIL':env.get('ADMIN_EMAIL') or 'admin@oneparking.test','ADMIN_PASSWORD':env.get('ADMIN_PASSWORD') or secrets.token_urlsafe(24),'VIEWER_EMAIL':env.get('VIEWER_EMAIL') or 'viewer@oneparking.test','VIEWER_PASSWORD':env.get('VIEWER_PASSWORD') or secrets.token_urlsafe(24),'DEVICE_TOKEN':token,'SESSION_SECURE_COOKIE':'true','SESSION_SAME_SITE':'lax'})
certs=root/'infra/certs';certs.mkdir(exist_ok=True);now=datetime.datetime.now(datetime.timezone.utc)
def keypem(k):return k.private_bytes(serialization.Encoding.PEM,serialization.PrivateFormat.TraditionalOpenSSL,serialization.NoEncryption())
if (certs/'root-ca-key.pem').exists():
 cakey=serialization.load_pem_private_key((certs/'root-ca-key.pem').read_bytes(),None);ca=x509.load_pem_x509_certificate((certs/'root-ca.pem').read_bytes())
else:
 cakey=rsa.generate_private_key(public_exponent=65537,key_size=2048);name=x509.Name([x509.NameAttribute(NameOID.COMMON_NAME,'OneParking Local Development CA')]);ca=(x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(cakey.public_key()).serial_number(x509.random_serial_number()).not_valid_before(now-datetime.timedelta(days=1)).not_valid_after(now+datetime.timedelta(days=365)).add_extension(x509.BasicConstraints(ca=True,path_length=0),True).add_extension(x509.KeyUsage(True,False,False,False,False,True,True,False,False),True).sign(cakey,hashes.SHA256()));(certs/'root-ca-key.pem').write_bytes(keypem(cakey));(certs/'root-ca.pem').write_bytes(ca.public_bytes(serialization.Encoding.PEM))
# BearSSL on ESP8266 matches dNSName even for a literal-IP URL. Keep IP SANs
# for standard clients and include the same literals as DNS SANs for BearSSL.
key=rsa.generate_private_key(public_exponent=65537,key_size=2048);addresses=list(dict.fromkeys(['127.0.0.1',host]));cert=(x509.CertificateBuilder().subject_name(x509.Name([x509.NameAttribute(NameOID.COMMON_NAME,host)])).issuer_name(ca.subject).public_key(key.public_key()).serial_number(x509.random_serial_number()).not_valid_before(now-datetime.timedelta(days=1)).not_valid_after(now+datetime.timedelta(days=90)).add_extension(x509.SubjectAlternativeName([x509.DNSName('localhost')]+[x509.DNSName(h) for h in addresses]+[x509.IPAddress(ipaddress.ip_address(h)) for h in addresses]),False).add_extension(x509.BasicConstraints(ca=False,path_length=None),True).add_extension(x509.ExtendedKeyUsage([x509.oid.ExtendedKeyUsageOID.SERVER_AUTH]),False).sign(cakey,hashes.SHA256()));(certs/'server-key.pem').write_bytes(keypem(key));(certs/'server.pem').write_bytes(cert.public_bytes(serialization.Encoding.PEM))
sketch=root/'firmware/OneParking';private=sketch/'secrets.h';old=private.read_text(encoding='utf-8') if private.exists() else ''
def cv(name,fallback):
 m=re.search(r'\b'+name+r'\[\]\s*=\s*("(?:\\.|[^"\\])*")',old)
 return json.loads(m.group(1)) if m else fallback
text='#pragma once\n// PRIVATE - never commit\n'
for name,v in [('WIFI_SSID',cv('WIFI_SSID','ISI_WIFI_2_4_GHZ')),('WIFI_PASSWORD',cv('WIFI_PASSWORD','ISI_PASSWORD_WIFI')),('API_BASE_URL',f'https://{host}:8443/api/v1'),('DEVICE_TOKEN',token)]:text+=f'constexpr char {name}[] = '+json.dumps(v)+';\n'
text+='constexpr char ROOT_CA_CERT[] = R"PEM('+ (certs/'root-ca.pem').read_text()+')PEM";\nconstexpr bool ENABLE_CARD_WRITE_TEST = false;\n';private.write_text(text,encoding='utf-8')
(root/'infra/network.json').write_text(json.dumps({'lan_ip':host,'https_port':8443,'mysql_port':13307,'phpmyadmin_port':8086}),encoding='utf-8')
print('Private configuration ready. HTTPS URL: https://'+host+':8443. Restart HTTPS after certificate changes, rebuild firmware before upload.')
