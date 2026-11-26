# Urutan demonstrasi dan bukti

1. Tunjukkan branch desain UI/UX sebagai sumber, lalu UI live dan database awal. Jangan merekam kredensial.
2. Login admin; guest401, viewer403, request admin tanpa CSRF419.
3. REGISTER kartu uji → claim → konfirmasi → saldo0. Tunjukkan UID leading zero dan penolakan duplikat.
4. TOPUP20.000 → tinjau/kofirmasi → ledger satu kredit. Perlihatkan penolakan nominal invalid dan retry/paralel dari laporan QA.
5. ENTRY → sesiACTIVE dan snapshot2.000 → perintahOPEN. Tap lagi ditolak. Pada hardware miniatur tunjukkan40°/180° setelah uji tersedia.
6. Ubah tarif9.000 setelah ENTRY → EXIT tetap memakai2.000 → saldo18.000/sesiCOMPLETED/satu debit. Uji saldo kurang pada kartu lain.
7. Tunjukkan riwayat/filter/CSV/audit, status perangkat dan display otomatis tanpa identitas lengkap.
8. Tunjukkan `parking:reconcile` PASS dan laporan rollback/10 request paralel.
9. Setelah hardware tersedia, TEST_RW pada Classic uji, WiFi putus, CA salah dan reboot. Catat actual tanpa mengklaim hasil yang belum dilakukan.
10. Akhiri dengan keterbatasan UID, saldo simulasi dan tidak adanya sensor palang nyata.

PPT tim dapat mengikuti10 poin ini dengan screenshot laporan dan bukti aktual. Video hardware dibuat setelah COM/board tersedia. Catat waktu, versi source, hardware dan hasil setiap TC.
