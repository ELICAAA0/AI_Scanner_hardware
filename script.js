const URL = "./model/";
let model, webcam, labelContainer, maxPredictions;

// Global state
window.lastSpoken = null;
window.speaking = false;
window.scanning = false;


// 🧩 Info utama (pendek)
const hardwareInfo = {
  "CPU": {
    text: "Central Processing Unit (CPU) adalah otak komputer yang mengontrol semua aktivitas pemrosesan data.",
    sound: "Ini adalah CPU atau Central Processing Unit. CPU adalah otak komputer yang mengontrol semua aktivitas pemrosesan data."
  },
  "RAM": {
    text: "Random Access Memory (RAM) menyimpan data sementara yang digunakan saat komputer beroperasi.",
    sound: "Ini adalah RAM atau Random Access Memory. RAM menyimpan data sementara yang digunakan saat komputer beroperasi."
  },
  "HDD": {
    text: "Hard Disk Drive (HDD) digunakan untuk menyimpan data dan file secara permanen seperti sistem operasi dan file pengguna.",
    sound: "Ini adalah harddisk. HDD digunakan untuk menyimpan data dan file secara permanen seperti sistem operasi dan file pengguna."
  },
  "PSU": {
    text: "Power Supply Unit (PSU) mengubah arus listrik dari stopkontak menjadi arus yang digunakan komponen komputer.",
    sound: "Ini adalah power supply. PSU mengubah arus listrik dari stopkontak menjadi arus yang digunakan komponen komputer."
  },
  "Motherboard": {
    text: "Motherboard menghubungkan semua komponen utama komputer agar dapat saling berkomunikasi.",
    sound: "Ini adalah motherboard. Motherboard menghubungkan semua komponen utama komputer agar dapat saling berkomunikasi."
  },
  "GPU": {
  text: "Graphics Processing Unit (GPU) adalah komponen yang memproses tampilan visual seperti gambar, animasi, dan video.",
  sound: "Ini adalah GPU atau Graphics Processing Unit. GPU memproses tampilan visual seperti gambar, animasi, dan video, terutama untuk gaming dan desain grafis."
  },
  "SSD": {
  text: "Solid State Drive (SSD) adalah media penyimpanan modern yang jauh lebih cepat dibanding HDD.",
  sound: "Ini adalah SSD atau Solid State Drive. SSD adalah media penyimpanan modern yang lebih cepat dalam membaca dan menulis data."
  },
  "Casing": {
  text: "Casing adalah rangka pelindung yang menampung seluruh komponen komputer dan menjaga aliran udara.",
  sound: "Ini adalah casing komputer. Casing berfungsi melindungi komponen dan menjaga sirkulasi udara agar tetap stabil."
  }
};

// 🧾 Info versi panjang
const detailedInfo = {
  "CPU": `
CPU (Central Processing Unit) adalah otak dari komputer. 
Tugas utamanya adalah mengeksekusi instruksi dari program dengan melakukan operasi aritmatika, logika, kontrol, dan input/output. 
CPU terdiri dari beberapa bagian utama:
<ul style="text-align:left;">
<li><b>ALU (Arithmetic Logic Unit)</b> – melakukan perhitungan matematika dan logika.</li>
<li><b>CU (Control Unit)</b> – mengatur dan mengendalikan jalannya instruksi.</li>
<li><b>Register</b> – tempat penyimpanan data sementara.</li>
</ul>
Semakin tinggi kecepatan prosesor, semakin cepat komputer bekerja.`,
  "RAM": `
RAM (Random Access Memory) adalah memori utama komputer yang bersifat sementara. 
Data di RAM akan hilang saat komputer dimatikan. 
Jenis RAM umum antara lain:
<ul style="text-align:left;">
<li><b>DDR3</b> – lebih lama, tapi masih banyak digunakan.</li>
<li><b>DDR4</b> – lebih cepat dan efisien.</li>
<li><b>DDR5</b> – generasi terbaru dengan kecepatan tinggi.</li>
</ul>
RAM mempengaruhi kecepatan multitasking komputer.`,
  "HDD": `
Hard Disk Drive (HDD) adalah perangkat penyimpanan data permanen berbasis piringan magnetik. 
Fungsinya adalah menyimpan sistem operasi, aplikasi, dan data pengguna. 
Bagian-bagian HDD antara lain:
<ul style="text-align:left;">
<li><b>Platter</b> – tempat data disimpan secara magnetik.</li>
<li><b>Head</b> – membaca dan menulis data ke platter.</li>
<li><b>Spindle</b> – memutar platter dengan kecepatan tinggi.</li>
</ul>
Saat ini HDD banyak digantikan oleh SSD karena lebih cepat.`,
  "PSU": `
Power Supply Unit (PSU) berfungsi mengubah arus listrik AC dari stopkontak menjadi DC yang stabil untuk semua komponen komputer. 
Komponen utama PSU:
<ul style="text-align:left;">
<li><b>Transformator</b> – menurunkan tegangan listrik.</li>
<li><b>Rectifier</b> – mengubah arus bolak-balik (AC) menjadi arus searah (DC).</li>
<li><b>Fan pendingin</b> – menjaga suhu PSU tetap stabil.</li>
</ul>
Daya PSU diukur dalam Watt (misalnya 450W, 600W). Pemilihan PSU harus sesuai kebutuhan daya seluruh komponen.`,
  "Motherboard": `
Motherboard adalah papan sirkuit utama yang menghubungkan semua komponen komputer seperti CPU, RAM, penyimpanan, dan perangkat eksternal. 
Bagian-bagian penting motherboard:
<ul style="text-align:left;">
<li><b>Socket CPU</b> – tempat memasang prosesor.</li>
<li><b>Slot RAM</b> – untuk memasang memori.</li>
<li><b>Chipset</b> – mengatur komunikasi antar komponen.</li>
<li><b>Port SATA & NVMe</b> – untuk media penyimpanan.</li>
</ul>
Motherboard menentukan kompatibilitas antar perangkat keras komputer.`,
"GPU": `
GPU (Graphics Processing Unit) adalah komponen yang bertanggung jawab terhadap pengolahan grafis pada komputer.
GPU digunakan untuk gaming, desain grafis, editing video, dan bahkan komputasi berat seperti AI.
Bagian-bagian GPU antara lain:
<ul style="text-align:left;">
<li><b>Core GPU</b> – memproses grafik dan visual.</li>
<li><b>VRAM</b> – memori khusus untuk menyimpan data grafis.</li>
<li><b>Heatsink dan Fan</b> – menjaga suhu tetap stabil.</li>
</ul>
GPU tersedia dalam dua jenis: integrated (menyatu dengan CPU) dan dedicated (kartu terpisah dengan performa lebih tinggi).
`,

"SSD": `
SSD (Solid State Drive) adalah perangkat penyimpanan modern yang menggunakan chip flash, sehingga memiliki kecepatan baca dan tulis yang jauh lebih tinggi dibanding HDD.
Kelebihan SSD:
<ul style="text-align:left;">
<li><b>Kecepatan booting sangat cepat</b>.</li>
<li><b>Tahan guncangan</b> karena tanpa komponen bergerak.</li>
<li><b>Hemat energi</b>.</li>
</ul>
Jenis SSD yang umum digunakan:
<ul style="text-align:left;">
<li><b>SATA SSD</b> – mudah kompatibel dengan banyak motherboard.</li>
<li><b>NVMe SSD</b> – kecepatan sangat tinggi melalui jalur PCIe.</li>
</ul>
`,
"Casing": `
Casing adalah rangka atau housing komputer yang berfungsi sebagai pelindung seluruh komponen internal agar tetap aman dan memiliki aliran udara yang baik.
Fungsi utama casing:
<ul style="text-align:left;">
<li><b>Melindungi komponen</b> dari debu, benturan, dan gangguan luar.</li>
<li><b>Mengatur aliran udara</b> melalui ventilasi dan slot fan.</li>
<li><b>Menyediakan ruang pemasangan</b> seperti motherboard, PSU, SSD/HDD, dan GPU.</li>
</ul>
Casing tersedia dalam berbagai ukuran seperti Mini Tower, Mid Tower, dan Full Tower.
`
};

  function getComponentKey(rawName) {
  const name = rawName.toLowerCase();

  if (name.includes("cpu")) return "CPU";
  if (name.includes("ram")) return "RAM";

  // HDD
  if (name.includes("hdd") || name.includes("disk")) return "HDD";

  // PSU
  if (
    name.includes("psu") ||
    name.includes("power") ||
    name.includes("supply") 
  ) return "PSU";

  // Motherboard
  if (name.includes("mother") || name.includes("board")) return "Motherboard";

  // GPU
  if (name.includes("gpu") || name.includes("graphic") || name.includes("vga")) return "GPU";

  // SSD
  if (name.includes("ssd")) return "SSD";

  // Casing
  if (
    name.includes("casing") ||
    name.includes("case") ||
    name.includes("tower") ||
    name.includes("chassis")
  ) return "Casing";

  return "";
}

// 🚀 Inisialisasi model
async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  const flip = true;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const facingMode = isMobile ? "environment" : "user";

  webcam = new tmImage.Webcam(250, 250, flip);
  await webcam.setup({ facingMode });
  await webcam.play();

  const webcamDiv = document.getElementById("webcam");
  webcamDiv.innerHTML = "";
  webcamDiv.appendChild(webcam.canvas);

  labelContainer = document.getElementById("label-container");
  labelContainer.innerHTML = "";
  for (let i = 0; i < maxPredictions; i++) labelContainer.appendChild(document.createElement("div"));

  window.scanning = true;
  requestAnimationFrame(loop);
}

// 🔁 Loop kamera
async function loop() {
  if (!window.scanning) return;
  webcam.update();
  await predict();
  requestAnimationFrame(loop);
}

// 🔍 Prediksi
async function predict() {
  if (!model || !webcam) return;

  let source;

// Jika user upload gambar → pakai gambar itu
if (window.uploadedImageForAI) {
    source = window.uploadedImageForAI;
} 
// Jika tidak, pakai webcam
else if (webcam && webcam.canvas.style.display !== "none") {
    source = webcam.canvas;
} 
// Kalau tidak ada sumber, hentikan prediksi
else {
    return;
}

const prediction = await model.predict(source);
  const bestPrediction = prediction.reduce((a, b) => a.probability > b.probability ? a : b);

  labelContainer.innerHTML = `<div style="font-size:20px; margin-top:10px;">${bestPrediction.className}: ${(bestPrediction.probability * 100).toFixed(1)}%</div>`;

  if (bestPrediction.probability > 0.98) {
    const name = bestPrediction.className.trim();
    const info = getHardwareInfo(name);
    if (!info) return;

    const status = document.getElementById("status");
    status.innerHTML = `✅ ${name} terdeteksi!`;
    status.style.color = "lime";

    if (window.lastSpoken !== name) {
    speak(info.sound);
    window.lastSpoken = name;
}


    // 🟢 Pastikan frame benar-benar tergambar
await new Promise(resolve => requestAnimationFrame(resolve));

const snapshot = webcam.canvas.toDataURL("image/png");

const img = new Image();
img.src = snapshot;

// ⛔ JANGAN langsung stop sebelum gambar jadi
img.onload = () => {
    // Sembunyikan kamera
    webcam.stop();
    webcam.canvas.style.display = "none";

    const webcamDiv = document.getElementById("webcam");

    // hapus snapshot lama
    const oldImg = document.getElementById("snapshotImage");
    if (oldImg) oldImg.remove();

    img.id = "snapshotImage";
    img.style.width = "250px";
    img.style.height = "250px";
    img.style.borderRadius = "50%";
    img.style.objectFit = "cover";

    webcamDiv.appendChild(img);
}

    const infoBox = document.getElementById("infoBox");
    document.getElementById("popupTitle").innerText = name;
    document.getElementById("popupText").innerText = info.text;
    infoBox.style.display = "block";

    // simpan nama komponen aktif untuk tombol info lengkap
    infoBox.dataset.activeComponent = name;

    window.scanning = false;
  }
}

// ▶ Tombol Start
document.getElementById("startBtn").addEventListener("click", () => {
  document.getElementById("infoBox").style.display = "none";
  window.lastSpoken = null;
  window.speaking = false;
  window.scanning = true;
  window.uploadedImageForAI = null;
  init();
});

// tombol capture
document.getElementById("captureBtn").addEventListener("click", () => {
    const area = document.getElementById("capture-area");

    html2canvas(area, { scale: 2 }).then(canvas => {
        const link = document.createElement("a");
        link.download = "capture.png";
        link.href = canvas.toDataURL();
        link.click();
    });
});



// =======================================
// 🔊 SISTEM SUARA INDONESIA — FINAL CLEAN
// =======================================

// Voice Indonesia global
let indoVoice = null;

// Ambil voice begitu browser siap
window.speechSynthesis.onvoiceschanged = () => {
    const voices = speechSynthesis.getVoices();

    // Cari voice terbaik berurutan ↓
    indoVoice =
        voices.find(v => v.lang === "id-ID" && v.name.toLowerCase().includes("google")) || // Google Indo (paling bagus)
        voices.find(v => v.lang === "id-ID") ||                                            // Voice Indo apa pun
        voices.find(v => v.lang.toLowerCase().includes("id")) ||                           // Indo varian lain
        voices.find(v => v.lang.toLowerCase().includes("ms")) ||                           // Malay fallback (lebih medok)
        null;

    console.log("Voice Indonesia terpilih:", indoVoice);
};

// Status suara
let soundEnabled = true;

// Fungsi bicara
function speak(text) {
    if (!soundEnabled) return;

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "id-ID";

    // Pakai voice Indonesia jika ada
    if (indoVoice) utter.voice = indoVoice;

    // Natural untuk Bahasa Indonesia
    utter.rate = 0.95;
    utter.pitch = 1.05;

    window.speechSynthesis.speak(utter);
}

// =============================
// 🔘 TOMBOL ON / OFF SUARA
// =============================

soundBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;

    if (soundEnabled) {
        soundBtn.innerText = "🔇 Matikan Suara";

        // reset supaya mau bicara lagi
        window.lastSpoken = null;
        window.speaking = false;
        window.speechSynthesis.cancel();

    } else {
        soundBtn.innerText = "🔊 Aktifkan Suara";

        // langsung hentikan suara
        window.speechSynthesis.cancel();
        window.speaking = false;
    }
});

// =============================
//  FUNGSI UPLOAD FOTO MANUAL
// =============================
const imageUpload = document.getElementById("imageUpload");
const uploadedImageArea = document.getElementById("uploadedImageArea");
const uploadedPreview = document.getElementById("uploadedPreview");
const webcamDiv = document.getElementById("webcam");

// klik tombol upload -> buka file dialog
document.getElementById("uploadBtn").addEventListener("click", () => {
    imageUpload.click();
});

// saat user memilih foto
imageUpload.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        const imgSrc = e.target.result;

        // ====== MATIKAN / SEMBUNYIKAN WEBCAM ======
        if (webcam && webcam.stop) {
            try { webcam.stop(); } catch {}
        }
        if (webcam && webcam.canvas) {
            webcam.canvas.style.display = "none";
        }

        // hapus snapshot lama
        const oldSnapshot = document.getElementById("snapshotImage");
        if (oldSnapshot) oldSnapshot.remove();

        // ====== TAMPILKAN FOTO UPLOAD SEBAGAI SNAPSHOT ======
        const img = new Image();
        img.src = imgSrc;
        img.id = "snapshotImage";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        webcamDiv.appendChild(img);

        // ====== SIMPAN UNTUK AI ======
        window.uploadedImageForAI = img;

        // ===============================================
        //  PREDIKSI FOTO UPLOAD (HARUS LEWAT CANVAS TMP)
        // ===============================================
        const tempCanvas = document.createElement("canvas");
        const ctx = tempCanvas.getContext("2d");

        img.onload = function () {
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            model.predict(tempCanvas).then(prediction => {
                const best = prediction.reduce((a, b) =>
                    a.probability > b.probability ? a : b
                );

                const name = best.className.trim();
                const info = getHardwareInfo(name);
                if (!info) return;

                // ====== INFO SINGKAT ======
                const status = document.getElementById("status");
                status.innerHTML = `✅ ${name} terdeteksi!`;
                status.style.color = "lime";

                // ====== SUARA ======
                if (window.lastSpoken !== name) {
                    speak(info.sound);
                    window.lastSpoken = name;
                }

                // ====== POPUP INFO LENGKAP ======
                const infoBox = document.getElementById("infoBox");
                document.getElementById("popupTitle").innerText = name;
                document.getElementById("popupText").innerText = info.text;
                infoBox.style.display = "block";

                infoBox.dataset.activeComponent = name;
            });
        };
    };

    reader.readAsDataURL(file);
});
// ==========================
// 🔧 FIX FINAL INFO LENGKAP
// ==========================

// Fungsi ambil info pendek (WAJIB ada di atas)
function getHardwareInfo(name) {
  const key = getComponentKey(name);
  return hardwareInfo[key] || null;
}

const closeInfoBtn = document.getElementById("closeInfo");
closeInfoBtn.addEventListener("click", () => {

  const infoBox = document.getElementById("infoBox");
  const rawName = infoBox.dataset.activeComponent || "";
  const key = getComponentKey(rawName);

  // --- MODE INFO PANJANG ---
  if (!infoBox.classList.contains("expanded")) {

    const fullText = detailedInfo[key] || "Belum ada info lengkap.";
    document.getElementById("popupText").innerHTML = fullText;

    closeInfoBtn.innerText = "Tutup Info";
    infoBox.classList.add("expanded");

    // 🔊 SUARA INFO PANJANG
    if (soundEnabled && detailedInfo[key]) {
      speak(fullText.replace(/<[^>]+>/g, "")); // hapus tag HTML
    }

  } 
  
  // --- MODE INFO PENDEK ---
  else {

    const info = getHardwareInfo(rawName);

    document.getElementById("popupText").innerHTML =
      info ? info.text : "";

    closeInfoBtn.innerText = "ℹ Info Lengkap";
    infoBox.classList.remove("expanded");

    // 🔊 SUARA INFO PENDEK
    if (soundEnabled && info) {
      speak(info.text);
    }
  }
});

// 🌙 Mode Gelap / Terang
const themeToggle = document.getElementById("themeToggle");
let darkMode = false;
themeToggle.addEventListener("click", () => {
  darkMode = !darkMode;
  if (darkMode) {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀ Mode Terang";
  } else {
    document.body.classList.remove("dark-mode");
    themeToggle.textContent = "🌙 Mode Gelap";
  }
});

// ℹ Tentang Proyek
document.getElementById("aboutBtn").addEventListener("click", () => {
  window.scanning = false;
  const infoBox = document.getElementById("infoBox");
  const popupTitle = document.getElementById("popupTitle");
  const popupText = document.getElementById("popupText");
  const closeInfoBtn = document.getElementById("closeInfo");

  popupTitle.innerText = "Tentang Proyek AI Scanner 🧠";
  popupText.innerHTML = `
  <b>AI Scanner Hardware Umum Komputer</b> adalah proyek pembelajaran interaktif
  berbasis web yang menggunakan <b>Teachable Machine</b> untuk mengenali
  komponen hardware Umum seperti CPU, RAM, HDD, SSD,  PSU, GPU, dan Motherboard.
  <br><br>
  Proyek ini dikembangkan oleh <b>Elisa Anggun Septiyaningrum</b> (XII TKJ 1, SMKN 1 Wonosegoro).
  <br><br>
  Dengan fitur:
  <ul style="text-align:left;">
    <li>📸 Deteksi real-time dengan kamera</li>
    <li>🔊 Penjelasan otomatis menggunakan suara</li>
    <li>💡 Mode Gelap Glowing</li>
    <li>📷 Capture hasil deteksi</li>
  </ul>
  <br>
  💻 Dibuat menggunakan <b>TensorFlow.js</b> dan <b>Teachable Machine</b>.
  `;

  infoBox.style.display = "block";
  closeInfoBtn.innerText = "Tutup Info";

  const newCloseHandler = () => {
    infoBox.style.display = "none";
    window.scanning = true;
    requestAnimationFrame(loop);
    closeInfoBtn.removeEventListener("click", newCloseHandler);
    closeInfoBtn.innerText = "ℹ Info Lengkap";
  };
  closeInfoBtn.addEventListener("click", newCloseHandler);
});

