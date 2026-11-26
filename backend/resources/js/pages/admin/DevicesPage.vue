<script setup>
import { useParkingStore } from "../../stores/parkingStore";
const { currentDevice, mode, selectedMode, applyMode, busy, time } =
    useParkingStore();
</script>
<template>
    <div class="grid gap-5 lg:grid-cols-2">
        <section class="card p-5">
            <div class="section-heading">
                <h2>{{ currentDevice?.name || "Perangkat belum tersedia" }}</h2>
                <span
                    class="badge"
                    :class="{ blocked: !currentDevice?.online }"
                    >{{ currentDevice?.online ? "Online" : "Offline" }}</span
                >
            </div>
            <dl class="device-details">
                <div>
                    <dt>Reader</dt>
                    <dd>RC522 SPI</dd>
                </div>
                <div>
                    <dt>Mode / versi server</dt>
                    <dd>
                        {{ mode }} / {{ currentDevice?.mode_version || "—" }}
                    </dd>
                </div>
                <div>
                    <dt>Heartbeat terakhir</dt>
                    <dd>{{ time(currentDevice?.last_seen_at) }}</dd>
                </div>
                <div>
                    <dt>RSSI</dt>
                    <dd>{{ currentDevice?.rssi ?? "—" }} dBm</dd>
                </div>
                <div>
                    <dt>Posisi yang diperintahkan</dt>
                    <dd>
                        {{
                            currentDevice?.online
                                ? currentDevice?.commanded_position
                                : "UNKNOWN"
                        }}
                    </dd>
                </div>
                <div>
                    <dt>ACK perintah terakhir</dt>
                    <dd>
                        {{
                            currentDevice?.last_command?.execution_status ||
                            "Belum ada"
                        }}
                    </dd>
                </div>
                <div>
                    <dt>Posisi fisik</dt>
                    <dd>Tidak terverifikasi tanpa sensor</dd>
                </div>
            </dl>
        </section>
        <section class="card p-5">
            <h2>Mode reader</h2>
            <p class="section-description">
                AUTO: tap pertama masuk, tap berikutnya keluar. REGISTER/TOPUP sementara kembali ke mode parkir saat popup ditutup.
            </p>
            <form @submit.prevent="applyMode()">
                <label
                    >Mode<select
                        aria-label="Mode reader"
                        v-model="selectedMode"
                        :disabled="busy"
                    >
                        <option value="AUTO">AUTO — Masuk / keluar otomatis</option>
                        <option value="REGISTER">
                            REGISTER — Registrasi kartu
                        </option>
                        <option value="TOPUP">
                            TOPUP — Pilih kartu top-up
                        </option>
                        <option value="ENTRY">ENTRY — Gerbang masuk</option>
                        <option value="EXIT">EXIT — Gerbang keluar</option>
                    </select></label
                >
                <p class="helper">
                    Perubahan menaikkan versi mode. Tunggu sinkronisasi
                    perangkat sebelum tap.
                </p>
                <button :disabled="busy">Terapkan mode</button>
            </form>
        </section>
    </div>
</template>
