# Pemetaan requirement PRD

| Requirement | Implementasi/bukti | Status |
|---|---|---|
|AUTH-01–04|Login/logout, hash, session CSRF, role, throttle|PASS software|
|CARD-01–04|UID leading zero, claim terikat sesi, holder dan status|PASS software; reader fisik pending|
|CARD-05|TEST_RW opt-in, Classic1K/4K block4 readback|Kode/compile PASS; kartu fisik NOT RUN|
|TOP-01–04|Scanclaim, batas integer, atomic ledger, idempotensi|PASS software +10 paralel|
|ENTRY-01–02|Timestamp server, unique generated guard, duplicate deny|PASS software|
|EXIT-01–05|Sesi/saldo/snapshot, debit unik, rollback|PASS software +10 paralel/retry|
|RATE-01|Settings, parking_rates, fee_snapshot, audit|PASS software|
|DEV-01–02|Bearer hashed, mode/version dan stale rejection|PASS software|
|DEV-03–06|Boot closed, fail closed, retry same ID, expiry/ACK/heartbeat|Software/compile PASS; fisik pending|
|WEB-01–04|UI/UX live, statistik/filter, polling display, privasi/expiry|PASS browser/software|
|WEB-05 P1|CSV terfilter dan formula protection|PASS software|
|SEC-01–02|Tidak ada API edit saldo, audit aman dan correlationID|PASS software|
|SEC-03|HTTPS/CA, credential privat, tanpa setInsecure|Client software PASS; ESP TLS pending|
|SEC-04–06|Schema/replay/ownership, locking/constraint, bukti test|PASS software; evidence hardware pending|
|NFR-01–02|p95 software/polling1s|PASS lokal; end-to-end ESP pending|
|NFR-03–06|Heartbeat/offline, no double debit, consistency/auth|PASS software; WiFi fisik pending|
|NFR-07–09|Responsif, secrets excluded, reproducible setup|PASS UI/build; hardware setup pending|

Semua P0 software tersedia untuk pengujian terintegrasi. Ini bukan tanda seluruh Definition of Done telah selesai: upload/read-write/gerak servo/WiFi/reboot/TLS ESP, bukti video/PPT dan pengumpulan individu masih memerlukan hardware/tim. Dokumen PRD asli tetap PRD.md; perubahan pin/kalibrasi yang berlaku ada pada WIRING.md.
