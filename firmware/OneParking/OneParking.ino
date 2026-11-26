#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Servo.h>
#include <ArduinoJson.h>
#include <time.h>
extern "C" {
#include <user_interface.h>
}
#include "secrets.h"

// Pin mengikuti CampusPay_Firmware.ino dari pengguna; kalibrasi dikonfirmasi pengguna.
constexpr uint8_t SS_PIN=4;       // D2
constexpr uint8_t RST_PIN=0;      // D3, GPIO boot strap: jangan ditahan LOW ketika boot
constexpr uint8_t SERVO_PIN=5;    // D1
constexpr int SERVO_ANGLE_CLOSED=180;
constexpr int SERVO_ANGLE_OPEN=40;
constexpr unsigned long HEARTBEAT_INTERVAL_MS=2000;
constexpr unsigned long CONFIG_INTERVAL_MS=10000;
constexpr unsigned long HTTP_TIMEOUT_MS=2000;
constexpr unsigned long CARD_REMOVAL_MS=700;
static_assert(SERVO_ANGLE_CLOSED>=0 && SERVO_ANGLE_CLOSED<=180,"Invalid closed angle");
static_assert(SERVO_ANGLE_OPEN>=0 && SERVO_ANGLE_OPEN<=180,"Invalid open angle");

MFRC522 rfid(SS_PIN,RST_PIN);
Servo gateServo;
BearSSL::X509List trustedCA(ROOT_CA_CERT);
BearSSL::Session tlsSession;
bool pendingSent=false;
String currentMode="UNKNOWN",pendingPayload,pendingRequestId,lastExecutedCommandId;
String ackCommandId,ackStatus,serialLine;
unsigned long currentModeVersion=0,lastHeartbeatTime=0,lastConfigTime=0;
unsigned long retryAt=0,ackRetryAt=0,gateCloseAtMillis=0,lastPresentAt=0,writeTestUntil=0;
bool isGateOpen=false,cardStillPresent=false,readerReady=false,bootHeartbeat=true;


int lastWiFiStatus=-100,lastApiStatus=0;
unsigned long lastConnectionLog=0,lastApiSuccessAt=0;
bool previouslyTimeReady=false;
bool timeReady();
String getIsoUtcNow();
const char* wifiStatusText(int state){
 switch(state){case WL_CONNECTED:return "CONNECTED";case WL_NO_SSID_AVAIL:return "SSID_NOT_FOUND";case WL_WRONG_PASSWORD:return "WRONG_PASSWORD";case WL_CONNECT_FAILED:return "CONNECT_FAILED";case WL_CONNECTION_LOST:return "CONNECTION_LOST";case WL_DISCONNECTED:return "DISCONNECTED";case WL_IDLE_STATUS:return "CONNECTING";default:return "WAITING";}
}
void printServerAddress(){
 String address(API_BASE_URL);int query=address.indexOf('?');if(query>=0)address=address.substring(0,query);
 if(address.indexOf('@')>=0)address="[URL userinfo disembunyikan]";
 Serial.printf("[SERVER] %s\n",address.c_str());
}
void printDiagnosticStatus(){
 Serial.println("\n========== STATUS CampusPay ==========");
 Serial.printf("[WIFI] %s (status=%d)\n",wifiStatusText(WiFi.status()),WiFi.status());
 if(WiFi.status()==WL_CONNECTED)Serial.printf("[WIFI] IP ESP=%s | gateway=%s | RSSI=%d dBm\n",WiFi.localIP().toString().c_str(),WiFi.gatewayIP().toString().c_str(),WiFi.RSSI());
 Serial.printf("[NTP] %s\n",timeReady()?getIsoUtcNow().c_str():"BELUM SINKRON - HTTPS belum dikirim");
 printServerAddress();
 Serial.printf("[RFID] reader=%s | SS=D2/GPIO4 | RST=D3/GPIO0\n",readerReady?"SIAP":"BELUM SIAP - periksa wiring/3V3");
 Serial.printf("[CONFIG] mode=%s | version=%lu\n",currentMode.c_str(),currentModeVersion);
 Serial.printf("[API] HTTP terakhir=%d | sukses terakhir %lu ms sejak boot\n",lastApiStatus,lastApiSuccessAt);
 Serial.printf("[SCAN] pending=%s | [SERVO] commanded=%s\n",pendingRequestId.isEmpty()?"TIDAK":"YA (ID tetap)",isGateOpen?"OPEN40":"CLOSED180");
 Serial.println("[INFO] Password WiFi dan token tidak dicetak. Perintah: STATUS atau HELP.");
 Serial.println("=====================================\n");
}
void updateConnectivityLogs(){
 int status=WiFi.status();bool clockReady=timeReady();
 if(status!=lastWiFiStatus){
  lastWiFiStatus=status;Serial.printf("[WIFI] %s (status=%d)\n",wifiStatusText(status),status);
  if(status==WL_CONNECTED){Serial.printf("[WIFI] Terhubung. IP ESP=%s | gateway=%s | RSSI=%d dBm\n",WiFi.localIP().toString().c_str(),WiFi.gatewayIP().toString().c_str(),WiFi.RSSI());Serial.println("[NTP] Menunggu sinkronisasi waktu UTC...");}
  else if(status==WL_WRONG_PASSWORD)Serial.println("[WIFI] Password ditolak. Periksa WIFI_PASSWORD di secrets.h, lalu upload ulang.");
  else if(status==WL_NO_SSID_AVAIL)Serial.println("[WIFI] SSID tidak ditemukan. Gunakan WiFi2.4GHz yang sama dengan laptop.");
 }
 if(clockReady&&!previouslyTimeReady){Serial.printf("[NTP] Sinkron UTC=%s; verifikasi TLS siap\n",getIsoUtcNow().c_str());previouslyTimeReady=true;}
 if(millis()-lastConnectionLog>=5000){
  lastConnectionLog=millis();
  if(status!=WL_CONNECTED)Serial.printf("[WIFI] Belum terhubung (%s). Dashboard tetap OFFLINE sampai heartbeat HTTP200.\n",wifiStatusText(status));
  else if(!clockReady)Serial.println("[NTP] WiFi terhubung, waktu belum valid. Pastikan akses internet/NTP UDP123; palang tetap tertutup.");
 }
}

bool timeReady(){return time(nullptr)>1700000000;}
String getIsoUtcNow(){time_t t=time(nullptr);struct tm utc;gmtime_r(&t,&utc);char b[25];strftime(b,sizeof(b),"%Y-%m-%dT%H:%M:%SZ",&utc);return String(b);}
String generateUUIDv4(){
 uint8_t b[16];for(int i=0;i<16;i+=4){uint32_t n=os_random();memcpy(b+i,&n,4);}b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;
 char out[37];snprintf(out,sizeof(out),"%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x",b[0],b[1],b[2],b[3],b[4],b[5],b[6],b[7],b[8],b[9],b[10],b[11],b[12],b[13],b[14],b[15]);return String(out);
}
int apiRequest(const String &path,const char *method,const String &body,JsonDocument &out){
 if(WiFi.status()!=WL_CONNECTED || !timeReady())return -1;
 BearSSL::WiFiClientSecure client;client.setTrustAnchors(&trustedCA);client.setSession(&tlsSession);client.setTimeout(HTTP_TIMEOUT_MS);
 HTTPClient https;https.setTimeout(HTTP_TIMEOUT_MS);
 if(!https.begin(client,String(API_BASE_URL)+"/device"+path)){Serial.printf("[HTTP] %s %s: URL/koneksi gagal diinisialisasi\n",method,path.c_str());lastApiStatus=-1;return -1;}
 https.addHeader("Authorization",String("Bearer ")+DEVICE_TOKEN);https.addHeader("Accept","application/json");https.addHeader("Content-Type","application/json");
 int status=https.sendRequest(method,body);lastApiStatus=status;
 if(status>0){
  String response=https.getString();auto error=deserializeJson(out,response);
  if(error!=DeserializationError::Ok){Serial.printf("[HTTP] %s %s -> HTTP%d, JSON tidak valid (%s). Periksa URL backend.\n",method,path.c_str(),status,error.c_str());status=-2;}
  else if(status>=200&&status<300){lastApiSuccessAt=millis();}
  else if(!(status==404&&path.startsWith("/requests/"))){
   Serial.printf("[HTTP] %s %s -> HTTP%d | code=%s\n",method,path.c_str(),status,out["code"]|"-");
   if(status==401||status==403)Serial.println("[AUTH] Perangkat ditolak. Periksa token lokal cocok dengan server dan perangkat enabled; token tidak dicetak.");
   if(status==409)Serial.println("[SYNC] Mode berubah atau waktu scan basi. Konfigurasi akan diambil ulang; lepas lalu tap kartu lagi.");
   if(status==422)Serial.println("[API] Payload ditolak validasi server. Kirim baris kode HTTP ini untuk pemeriksaan kontrak.");
   if(status>=500)Serial.println("[SERVER] Layanan gagal. Tidak membuka berdasarkan timeout; retry memakai request_id yang sama.");
  }
 }else{
  Serial.printf("[HTTP] %s %s -> %d (%s)\n",method,path.c_str(),status,https.errorToString(status).c_str());
  char detail[128]={0};int sslError=client.getLastSSLError(detail,sizeof(detail));
  if(sslError)Serial.printf("[TLS] error=%d | %s\n",sslError,detail);
  Serial.println("[LAN] Cek IP laptop/port API, server aktif, satu WiFi, firewall8443, waktu NTP dan CA. Verifikasi TLS tetap aktif.");
 }
 https.end();return status;
}
void queueAck(const String &id,const char *status){ackCommandId=id;ackStatus=status;ackRetryAt=0;}
void closeGateImmediate(){gateServo.write(SERVO_ANGLE_CLOSED);isGateOpen=false;Serial.println("[SERVO] CLOSED_COMMANDED 180 deg; posisi fisik tidak diukur");}
void updateServoTimer(){if(isGateOpen && (long)(millis()-gateCloseAtMillis)>=0){closeGateImmediate();queueAck(lastExecutedCommandId,"CLOSED_COMMANDED");}}
void sendPendingAck(){
 if(ackCommandId.isEmpty() || (long)(millis()-ackRetryAt)<0)return;
 JsonDocument payload,out;payload["status"]=ackStatus;payload["acknowledged_at"]=getIsoUtcNow();String body;serializeJson(payload,body);
 int status=apiRequest("/commands/"+ackCommandId+"/ack","POST",body,out);
 if((status>=200&&status<300)||status==404){ackCommandId="";ackStatus="";}ackRetryAt=millis()+3000;
}
void executeGateCommand(JsonDocument &response){
 if(!response["success"].as<bool>())return;
 String code=response["code"]|"";if(code!="ENTRY_SUCCESS"&&code!="EXIT_SUCCESS")return;
 JsonObject command=response["gate_command"].as<JsonObject>();if(command.isNull())return;
 String id=command["id"]|"",action=command["action"]|"";
 long duration=command["duration_ms"]|0L;unsigned long expiry=command["expires_epoch"]|0UL;
 if(id.isEmpty()||id==lastExecutedCommandId||action!="OPEN")return;
 // Missing/invalid expiry is fail closed. Never parse ambiguous local-time timestamps.
 if(!timeReady()||expiry<=(unsigned long)time(nullptr)||duration<500||duration>5000){lastExecutedCommandId=id;queueAck(id,"EXPIRED");Serial.println("[GATE] Command invalid/expired; palang tetap tertutup");return;}
 lastExecutedCommandId=id;gateServo.write(SERVO_ANGLE_OPEN);isGateOpen=true;gateCloseAtMillis=millis()+duration;
 Serial.printf("[SERVO] OPEN_COMMANDED 40 deg, %ld ms; posisi fisik tidak diukur\n",duration);
 // No HTTP/ACK while open: blocking TLS must not delay closing the miniature gate.
}
void fetchDeviceConfig(){
 JsonDocument out;int status=apiRequest("/config","GET","",out);
 if(status==200){String previous=currentMode;unsigned long version=currentModeVersion;currentMode=out["mode"].as<String>();currentModeVersion=out["mode_version"]|0UL;if(previous!=currentMode||version!=currentModeVersion)Serial.printf("[CONFIG] HTTP200 mode=%s version=%lu. Siap tap kartu.\n",currentMode.c_str(),currentModeVersion);}
 else Serial.printf("[CONFIG] Gagal mengambil mode: HTTP%d\n",status);
 lastConfigTime=millis();
}
void sendHeartbeat(){
 JsonDocument payload,out;payload["gate_state"]=isGateOpen?"COMMANDED_OPEN":"COMMANDED_CLOSED";payload["mode_version"]=currentModeVersion;payload["rssi"]=WiFi.RSSI();payload["sent_at"]=getIsoUtcNow();payload["boot"]=bootHeartbeat;payload["reader_ready"]=readerReady;
 String body;serializeJson(payload,body);
 if(apiRequest("/heartbeat","POST",body,out)==200){currentMode=out["mode"].as<String>();currentModeVersion=out["mode_version"]|currentModeVersion;bootHeartbeat=false;Serial.printf("[HEARTBEAT] HTTP200 terkirim | mode=%s version=%lu | dashboard seharusnya Online\n",currentMode.c_str(),currentModeVersion);}
 else Serial.println("[HEARTBEAT] Belum berhasil. Lihat pesan HTTP/TLS sebelumnya.");
 lastHeartbeatTime=millis();
}
void processPendingScan(){
 if(pendingRequestId.isEmpty()||(long)(millis()-retryAt)<0)return;
 JsonDocument out;int status=404;
 if(pendingSent)status=apiRequest("/requests/"+pendingRequestId,"GET","",out);
 if(status==404){out.clear();pendingSent=true;status=apiRequest("/scan","POST",pendingPayload,out);}
 if(status>=200&&status<300){Serial.printf("[SCAN] Server HTTP%d -> %s | success=%s\n",status,out["code"]|"ERROR",out["success"].as<bool>()?"true":"false");executeGateCommand(out);pendingPayload="";pendingRequestId="";}
 else if(status==401||status==403||status==409||status==422){Serial.printf("[SCAN] Ditolak HTTP%d (%s); lepas kartu sebelum mencoba kembali\n",status,out["code"]|"-");pendingPayload="";pendingRequestId="";currentModeVersion=0;}
 else Serial.println("[SCAN] Hasil belum diketahui; retry memakai request_id dan payload yang sama");
 retryAt=millis()+2000;
}
String formatNormalizedUID(){String uid;for(byte i=0;i<rfid.uid.size;i++){if(rfid.uid.uidByte[i]<16)uid+='0';uid+=String(rfid.uid.uidByte[i],HEX);}uid.toUpperCase();return uid;}
void runCardReadWriteTest(){
 if(!ENABLE_CARD_WRITE_TEST){Serial.println("[TEST-RW] Nonaktif. Hanya aktifkan pada kartu uji milik sendiri.");return;}
 auto type=rfid.PICC_GetType(rfid.uid.sak);
 if(type!=MFRC522::PICC_TYPE_MIFARE_1K&&type!=MFRC522::PICC_TYPE_MIFARE_4K){Serial.println("[TEST-RW] Ditolak: bukan MIFARE Classic 1K/4K");return;}
 MFRC522::MIFARE_Key key;memset(key.keyByte,0xFF,6);
 byte data[16]={'C','A','M','P','U','S','P','A','Y','_','T','E','S','T','0','1'},buffer[18],size=18;
 auto result=rfid.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A,4,&key,&rfid.uid);
 if(result==MFRC522::STATUS_OK)result=rfid.MIFARE_Write(4,data,16);
 if(result==MFRC522::STATUS_OK)result=rfid.MIFARE_Read(4,buffer,&size);
 Serial.println(result==MFRC522::STATUS_OK&&memcmp(data,buffer,16)==0?"[TEST-RW] WRITE_VERIFY_OK":"[TEST-RW] WRITE_VERIFY_FAILED");
 rfid.PCD_StopCrypto1();
}
void pollSerial(){
 while(Serial.available()){char c=Serial.read();if(c=='\n'||c=='\r'){serialLine.trim();if(serialLine.equalsIgnoreCase("STATUS")){printDiagnosticStatus();}else if(serialLine.equalsIgnoreCase("HELP")){Serial.println("STATUS: status koneksi; TEST_RW: uji block4 jika diaktifkan. Buka popup registrasi/top-up di dashboard, tunggu instruksi tap. AUTO: tap masuk, tap berikutnya keluar.");}else if(serialLine.equalsIgnoreCase("TEST_RW")){if(ENABLE_CARD_WRITE_TEST){writeTestUntil=millis()+5000;Serial.println("[TEST-RW] Tap kartu uji Classic dalam 5 detik; menimpa block 4 nonfinansial");}else Serial.println("[TEST-RW] ENABLE_CARD_WRITE_TEST=false");}serialLine="";}else if(serialLine.length()<32)serialLine+=c;}
}
void pollCard(){
 byte atqa[2],length=2;auto result=rfid.PICC_WakeupA(atqa,&length);
 if(result!=MFRC522::STATUS_OK&&result!=MFRC522::STATUS_COLLISION){if(cardStillPresent&&millis()-lastPresentAt>=CARD_REMOVAL_MS){cardStillPresent=false;Serial.println("[RFID] Kartu dilepas. Siap tap berikutnya.");}return;}
 lastPresentAt=millis();if(!rfid.PICC_ReadCardSerial())return;
 if(!cardStillPresent){
  cardStillPresent=true;Serial.printf("[RFID] UID=%s | mode=%s version=%lu\n",formatNormalizedUID().c_str(),currentMode.c_str(),currentModeVersion);
  if(writeTestUntil && (long)(writeTestUntil-millis())>0){writeTestUntil=0;runCardReadWriteTest();}
  else if(pendingRequestId.isEmpty()&&currentModeVersion&&WiFi.status()==WL_CONNECTED&&timeReady()){
   JsonDocument payload;pendingRequestId=generateUUIDv4();pendingSent=false;payload["request_id"]=pendingRequestId;payload["uid"]=formatNormalizedUID();payload["mode_version"]=currentModeVersion;payload["scanned_at"]=getIsoUtcNow();pendingPayload="";serializeJson(payload,pendingPayload);retryAt=0;Serial.printf("[SCAN] UID dibaca, mengirim ke server (request=%s). REGISTER tidak membuka servo.\n",pendingRequestId.c_str());
  }else Serial.println("[RFID] Server/jaringan belum siap; palang tetap tertutup. Lepas lalu tap lagi.");
 }
 rfid.PICC_HaltA();rfid.PCD_StopCrypto1();
}
void setup(){
 Serial.begin(115200);delay(150);Serial.println("\n=== CampusPay UID-only / Serial diagnostics v1.2 ===");Serial.println("[BOOT] Dashboard: tambah kartu / pilih nominal top-up -> popup -> tap+lepas. Tutup popup untuk kembali ke mode parkir AUTO/ENTRY/EXIT.");printServerAddress();if(String(WIFI_PASSWORD).indexOf("PASSWORD_WIFI")>=0||String(WIFI_PASSWORD).startsWith("ISI_")||strlen(WIFI_PASSWORD)==0)Serial.println("[CONFIG] WIFI_PASSWORD masih kosong/placeholder. Isi secrets.h dan upload ulang; nilainya tidak dicetak.");gateServo.attach(SERVO_PIN);closeGateImmediate();SPI.begin();rfid.PCD_Init();byte version=rfid.PCD_ReadRegister(rfid.VersionReg);readerReady=version!=0&&version!=0xFF;Serial.printf("[RFID] VersionReg=0x%02X, ready=%d\n",version,readerReady);
 WiFi.mode(WIFI_STA);WiFi.setAutoReconnect(true);WiFi.begin(WIFI_SSID,WIFI_PASSWORD);configTime(0,0,"pool.ntp.org","time.nist.gov");Serial.println("[BOOT] Menunggu WiFi, waktu NTP dan HTTPS. Tidak memulihkan command lama.");
}
void loop(){
 updateServoTimer();if(isGateOpen){delay(5);return;}
 pollSerial();updateConnectivityLogs();pollCard();
 if(WiFi.status()==WL_CONNECTED&&timeReady()){
  // One network operation per loop; scans take priority over periodic traffic.
  if(!ackCommandId.isEmpty()&&(long)(millis()-ackRetryAt)>=0){sendPendingAck();delay(5);return;}
  if(!pendingRequestId.isEmpty()){processPendingScan();delay(5);return;}
  if(currentModeVersion==0){fetchDeviceConfig();delay(5);return;}
  if(millis()-lastHeartbeatTime>=HEARTBEAT_INTERVAL_MS){sendHeartbeat();delay(5);return;}
  if(millis()-lastConfigTime>=CONFIG_INTERVAL_MS)fetchDeviceConfig();
 }
 delay(20);
}
