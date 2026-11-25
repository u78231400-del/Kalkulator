let layar = document.getElementById("layar");
let daftarRiwayat = document.getElementById("daftar-riwayat");
let panelRiwayat = document.getElementById("panel-riwayat");
let tombolRiwayat = document.getElementById("tombol-riwayat");
let tombolMode = document.getElementById("tombol-mode");
let badgeRiwayat = document.getElementById("badge-riwayat");
let riwayat = []; // Array untuk menampung riwayat

// ===== Mode sudut: DEG (derajat) atau RAD (radian) =====
let modeDerajat = true;

function gantiMode() {
    modeDerajat = !modeDerajat;
    tombolMode.innerText = modeDerajat ? "DEG" : "RAD";
    tombolMode.blur();
}

// ===== Fungsi matematika ilmiah =====
function ubahSudut(x) { return modeDerajat ? x * (Math.PI / 180) : x; }
function sin(x) { return Math.sin(ubahSudut(x)); }
function cos(x) { return Math.cos(ubahSudut(x)); }
function tan(x) { return Math.tan(ubahSudut(x)); }
function sqrt(x) {
    if (x < 0) throw "Negatif"; // validasi manual: Math.sqrt(-1) hanya menghasilkan NaN
    return Math.sqrt(x);
}

// ===== Panel riwayat =====
function toggleRiwayat() {
    let terbuka = panelRiwayat.hidden; // jika sekarang tersembunyi, berarti akan dibuka
    panelRiwayat.hidden = !terbuka;
    tombolRiwayat.classList.toggle("aktif", terbuka);
    tombolRiwayat.setAttribute("aria-expanded", terbuka);
    tombolRiwayat.blur(); // agar tombol Enter keyboard tidak ikut memicu klik ikon
}

function catatRiwayat(operasi, hasil) {
    // Beri keterangan satuan sudut jika ekspresi memakai sin/cos/tan
    let label = /sin|cos|tan/.test(operasi) ? (modeDerajat ? " [DEG]" : " [RAD]") : "";
    riwayat.unshift(operasi + label + " = " + hasil); // Tambah ke awal array
    if (riwayat.length > 5) riwayat.pop();            // Batasi maksimal 5 data

    daftarRiwayat.innerHTML = "";
    riwayat.forEach(item => {
        let li = document.createElement("li");
        li.innerText = item;
        daftarRiwayat.appendChild(li);
    });

    badgeRiwayat.innerText = riwayat.length;
    badgeRiwayat.hidden = false;
}

// ===== Layar & kursor =====
// Perkecil font otomatis saat teks panjang (minimal 14px), sisanya bisa digeser
function perbaruiUkuran() {
    let n = layar.value.length;
    let ukuran = Math.max(14, 26 - Math.max(0, n - 12) * 0.8);
    layar.style.fontSize = ukuran + "px";
}

function aturKursor(posisi) {
    layar.focus({ preventScroll: true });
    layar.setSelectionRange(posisi, posisi);
    perbaruiUkuran();
}

// Jika layar sedang menampilkan "Error", kosongkan dulu sebelum input baru
function pulihkanDariError() {
    if (layar.value === "Error") layar.value = "";
}

// Sisipkan teks DI POSISI KURSOR (bukan selalu di akhir)
function sisipkan(teks) {
    pulihkanDariError();
    let mulai = layar.selectionStart;
    let akhir = layar.selectionEnd;
    layar.value = layar.value.slice(0, mulai) + teks + layar.value.slice(akhir);
    aturKursor(mulai + teks.length);
}

function masukkanNilai(nilai) { sisipkan(nilai); }

function bersihkanLayar() {
    layar.value = "";
    aturKursor(0);
}

// DEL: hapus karakter sebelum kursor (atau teks yang diblok)
function hapusSatu() {
    if (layar.value === "Error") { bersihkanLayar(); return; }
    let mulai = layar.selectionStart;
    let akhir = layar.selectionEnd;
    if (mulai !== akhir) {
        layar.value = layar.value.slice(0, mulai) + layar.value.slice(akhir);
        aturKursor(mulai);
        return;
    }
    if (mulai === 0) return;
    // Jika di belakang kursor ada "sin(", "cos(", "tan(" atau "√(", hapus satu paket
    let m = layar.value.slice(0, mulai).match(/(sin\(|cos\(|tan\(|√\()$/);
    let panjang = m ? m[0].length : 1;
    layar.value = layar.value.slice(0, mulai - panjang) + layar.value.slice(mulai);
    aturKursor(mulai - panjang);
}

// Tombol Delete di keyboard: hapus karakter setelah kursor
function hapusDepan() {
    if (layar.value === "Error") { bersihkanLayar(); return; }
    let mulai = layar.selectionStart;
    let akhir = layar.selectionEnd;
    if (mulai !== akhir) { hapusSatu(); return; }
    if (mulai >= layar.value.length) return;
    layar.value = layar.value.slice(0, mulai) + layar.value.slice(mulai + 1);
    aturKursor(mulai);
}

// Geser kursor ke kiri (-1) atau kanan (+1) untuk mengganti angka di tengah
function geserKursor(arah) {
    let posisi = (arah < 0) ? layar.selectionStart : layar.selectionEnd;
    if (layar.selectionStart !== layar.selectionEnd) {
        // Ada blok teks: lompat ke ujung blok
        aturKursor(posisi);
        return;
    }
    let baru = Math.min(layar.value.length, Math.max(0, posisi + arah));
    aturKursor(baru);
}

// ===== Perhitungan =====
// sin / cos / tan / √ hanya menulis fungsi ke layar; hasil baru muncul setelah "="
function hitungIlmiah(tipe) {
    pulihkanDariError();
    let simbol = (tipe === 'sqrt') ? "√(" : tipe + "(";
    // Jika sebelum kursor ada angka atau ")", sisipkan perkalian otomatis: 2sin( -> 2*sin(
    let sebelum = layar.value.slice(0, layar.selectionStart);
    if (/[0-9)]$/.test(sebelum)) simbol = "*" + simbol;
    sisipkan(simbol);
}

function hitungHasil() {
    if (layar.value === "" || layar.value === "Error") return;
    try {
        let op = layar.value;

        // Tutup otomatis kurung yang belum ditutup: sin(30 -> sin(30)
        let terbuka = (op.match(/\(/g) || []).length;
        let tertutup = (op.match(/\)/g) || []).length;
        if (terbuka > tertutup) op += ")".repeat(terbuka - tertutup);

        // Ubah √ menjadi sqrt, dan buang nol di depan angka (di JavaScript "010" dianggap oktal = 8)
        let ekspresi = op.replace(/√\(/g, "sqrt(")
                         .replace(/(^|[^0-9.])0+(?=[0-9])/g, "$1");

        let hasil = eval(ekspresi);
        if (typeof hasil !== "number" || !isFinite(hasil)) throw "Tidak valid";

        hasil = parseFloat(hasil.toFixed(5)); // bulatkan 5 desimal, hilangkan nol berlebih
        layar.value = hasil;
        aturKursor(layar.value.length);
        catatRiwayat(op, hasil);
    } catch (error) {
        layar.value = "Error";
        aturKursor(layar.value.length);
    }
}

// ===== Fitur Keyboard Listener =====
document.addEventListener("keydown", function (event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return; // biarkan Ctrl+C, dll.
    let key = event.key;

    if (/^[0-9+\-*/.()]$/.test(key)) { event.preventDefault(); masukkanNilai(key); }
    else if (key === "Enter") { event.preventDefault(); hitungHasil(); }
    else if (key === "Backspace") { event.preventDefault(); hapusSatu(); }
    else if (key === "Delete") { event.preventDefault(); hapusDepan(); }
    else if (key === "Escape") bersihkanLayar();
    else if (!event.shiftKey && key === "ArrowLeft") { event.preventDefault(); geserKursor(-1); }
    else if (!event.shiftKey && key === "ArrowRight") { event.preventDefault(); geserKursor(1); }
    else if (!event.shiftKey && key === "Home") { event.preventDefault(); aturKursor(0); }
    else if (!event.shiftKey && key === "End") { event.preventDefault(); aturKursor(layar.value.length); }
});