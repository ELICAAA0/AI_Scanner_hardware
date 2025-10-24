const URL = "./model/";
let model, webcam, labelContainer, maxPredictions;

// Global state
window.lastSpoken = null;
window.speaking = false;
window.scanning = false;

// 🧩 Data komponen
const hardwareInfo = {
  "CPU": {
    text: "CPU (Central Processing Unit) adalah otak komputer yang mengontrol semua aktivitas pemrosesan data.",
    sound: "Ini adalah CPU atau Central Processing Unit. CPU adalah otak komputer yang mengontrol semua aktivitas pemrosesan data."
  },
  "RAM": {
    text: "RAM (Random Access Memory) menyimpan data sementara yang digunakan saat komputer beroperasi.",
    sound: "Ini adalah RAM atau Random Access Memory. RAM menyimpan data sementara yang digunakan saat komputer beroperasi."
  },
  "Harddisk": {
    text: "Harddisk digunakan untuk menyimpan data dan file secara permanen seperti sistem operasi dan file pengguna.",
    sound: "Ini adalah harddisk. Harddisk digunakan untuk menyimpan data dan file secara permanen seperti sistem operasi dan file pengguna."
  },
  "Power Supply": {
    text: "Power Supply Unit (PSU) mengubah arus listrik dari stopkontak menjadi arus yang digunakan komponen komputer.",
    sound: "Ini adalah power supply. Power supply mengubah arus listrik dari stopkontak menjadi arus yang digunakan komponen komputer."
  },
  "Motherboard": {
    text: "Motherboard menghubungkan semua komponen utama komputer agar dapat saling berkomunikasi.",
    sound: "Ini adalah motherboard. Motherboard menghubungkan semua komponen utama komputer agar dapat saling berkomunikasi."
  }
};

window.speechSynthesis.onvoiceschanged = () => {
  window.availableVoices = speechSynthesis.getVoices();
};

// 🧠 Fungsi bantu ambil info berdasarkan nama
function getHardwareInfo(label) {
  const lower = label.toLowerCase();
  if (lower.includes("cpu")) return hardwareInfo["CPU"];
  if (lower.includes("ram")) return hardwareInfo["RAM"];
  if (lower.includes("hdd") || lower.includes("hard") || lower.includes("disk")) return hardwareInfo["Harddisk"];
  if (lower.includes("power") || lower.includes("supply") || lower.includes("psu")) return hardwareInfo["Power Supply"];
  if (lower.includes("board") || lower.includes("mother")) return hardwareInfo["Motherboard"];
  return null;
}

// 🔊 Fungsi suara
function speak(text) {
  const synth = window.speechSynthesis;
  synth.cancel(); // hentikan suara sebelumnya biar gak tumpuk

  const utter = new SpeechSynthesisUtterance(text);
  const voices = synth.getVoices();
  const indoVoice = voices.find(v => v.lang.startsWith("id") || v.name.toLowerCase().includes("indonesia"));
  if (indoVoice) utter.voice = indoVoice;

  utter.lang = "id-ID";
  utter.rate = 1;
  utter.pitch = 1;
  synth.speak(utter);
}

// 🚀 Inisialisasi model & kamera
async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  // 🌐 Deteksi apakah perangkat HP → gunakan kamera belakang
  const flip = true;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const facingMode = isMobile ? "environment" : "user"; // otomatis belakang di HP

  webcam = new tmImage.Webcam(250, 250, flip);
  await webcam.setup({ facingMode: facingMode }); // gunakan mode kamera yang sesuai
  await webcam.play();

  const webcamDiv = document.getElementById("webcam");
  webcamDiv.innerHTML = "";
  webcamDiv.appendChild(webcam.canvas);

  labelContainer = document.getElementById("label-container");
  labelContainer.innerHTML = "";

  for (let i = 0; i < maxPredictions; i++) {
    labelContainer.appendChild(document.createElement("div"));
  }

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

// 🔍 Prediksi gambar
async function predict() {
  if (!model || !webcam) return;

  const now = Date.now();
  if (window.lastPredictTime && now - window.lastPredictTime < 200) return;
  window.lastPredictTime = now;

  const prediction = await model.predict(webcam.canvas);
  const bestPrediction = prediction.reduce((a, b) =>
    a.probability > b.probability ? a : b
  );

  labelContainer.innerHTML = `<div style="font-size:20px; margin-top:10px;">${bestPrediction.className}: ${(bestPrediction.probability * 100).toFixed(1)}%</div>`;

  const webcamCanvas = document.querySelector("#webcam canvas");

  if (bestPrediction.probability > 0.98) {
    const name = bestPrediction.className.trim();
    const info = getHardwareInfo(name);

    if (webcamCanvas) webcamCanvas.style.boxShadow = "0 0 20px lime";
    const status = document.getElementById("status");
    status.innerHTML = `✅ ${name} terdeteksi!`;
    status.style.color = "lime";

    if (!window.speaking || window.lastSpoken !== name) {
      speak(info ? info.sound : "Komponen ini belum terdaftar.");
      window.speaking = true;
      window.lastSpoken = name;
      setTimeout(() => (window.speaking = false), 4000);
    }

    const snapshot = webcam.canvas.toDataURL("image/png");
    const img = new Image();
    img.src = snapshot;
    img.style.width = "480px";
    img.style.borderRadius = "10px";
    img.style.objectFit = "cover";
    img.style.transition = "all 0.4s ease";

    try {
      webcam.stop();
    } catch (err) {
      console.error("Gagal matikan kamera:", err);
    }

    const webcamDiv = document.getElementById("webcam");
    webcamDiv.innerHTML = "";
    webcamDiv.appendChild(img);

    const infoBox = document.getElementById("infoBox");
    document.getElementById("popupTitle").innerText = name;
    document.getElementById("popupText").innerText = info ? info.text : "Belum ada info untuk komponen ini.";
    infoBox.style.display = "block";
    infoBox.style.zIndex = "10";
    infoBox.style.position = "relative";

    window.scanning = false;
  } else {
    if (webcamCanvas) webcamCanvas.style.boxShadow = "none";
    const status = document.getElementById("status");
    status.innerHTML = "❌ Komponen tidak terdeteksi";
    status.style.color = "red";
    const info = document.getElementById("info");
    if (info.innerText.trim() === "") {
      info.innerText = "Arahkan kamera ke komponen perangkat keras (CPU, RAM, HDD, PSU, Motherboard).";
    }
  }
}

// ▶ Mulai Scan
document.getElementById("startBtn").addEventListener("click", () => {
  const infoBox = document.getElementById("infoBox");
  infoBox.style.display = "none";
  document.getElementById("status").innerText = "";
  document.getElementById("info").innerText = "";
  window.lastSpoken = null;
  window.speaking = false;
  window.scanning = true;
  init();
});

// 🔊 Tombol Suara
document.getElementById("soundBtn").addEventListener("click", () => {
  if (window.lastSpoken) {
    const info = getHardwareInfo(window.lastSpoken);
    speak(info ? info.sound : "Belum ada komponen yang terdeteksi.");
  } else {
    speak("Belum ada komponen yang terdeteksi.");
  }
});

// 🎯 Tombol Info Lengkap (dengan suara tambahan)
const closeInfoBtn = document.getElementById("closeInfo");
closeInfoBtn.addEventListener("click", () => {
  const infoBox = document.getElementById("infoBox");
  const titleRaw = document.getElementById("popupTitle").innerText.trim().toLowerCase();
  const popupText = document.getElementById("popupText");
  const isExpanded = infoBox.classList.contains("expanded");

  let titleKey = "";
  if (titleRaw.includes("cpu")) titleKey = "CPU";
  else if (titleRaw.includes("ram")) titleKey = "RAM";
  else if (titleRaw.includes("hard") || titleRaw.includes("disk")) titleKey = "HDD";
  else if (titleRaw.includes("power") || titleRaw.includes("psu")) titleKey = "PSU";
  else if (titleRaw.includes("mother") || titleRaw.includes("board")) titleKey = "Motherboard";

  const hardwareInfo = {
    "CPU": {
      text: "CPU (Central Processing Unit) adalah otak komputer yang mengatur dan menjalankan semua instruksi dari program.",
      fullInfo: `
        🔹 <b>Pengertian:</b> CPU adalah komponen utama yang bertanggung jawab untuk mengeksekusi perintah dan mengolah data di komputer.
        <br><br>
        🔹 <b>Komponen Utama:</b> ALU (Arithmetic Logic Unit), CU (Control Unit), dan Register.
        <br><br>
        🔹 <b>Fungsi/Manfaat:</b> Mengolah data, mengontrol perangkat lain, dan menjalankan instruksi program.
        <br><br>
        🔹 <b>Macam/Contoh:</b> Intel Core i7, AMD Ryzen 5, Apple M2.
        <br><br>
        💡 <b>Fakta Menarik:</b> Kecepatan CPU diukur dalam GHz (GigaHertz), yang menunjukkan berapa milyar operasi bisa dilakukan per detik.
      `
    },
    "RAM": {
      text: "RAM (Random Access Memory) adalah tempat penyimpanan sementara saat komputer sedang digunakan.",
      fullInfo: `
        🔹 <b>Pengertian:</b> RAM menyimpan data dan instruksi yang sedang digunakan agar bisa diakses cepat oleh CPU.
        <br><br>
        🔹 <b>Komponen Utama:</b> Chip memori, jalur data, dan slot RAM di motherboard.
        <br><br>
        🔹 <b>Fungsi/Manfaat:</b> Mempercepat akses data dan membantu multitasking tanpa lag.
        <br><br>
        🔹 <b>Macam/Contoh:</b> DDR3, DDR4, DDR5 — semakin baru semakin cepat.
        <br><br>
        💡 <b>Fakta Menarik:</b> Semakin besar kapasitas RAM, semakin banyak program yang bisa dibuka bersamaan.
      `
    },
    "HDD": {
      text: "Hard Disk Drive (HDD) adalah media penyimpanan utama untuk menyimpan data dan sistem operasi.",
      fullInfo: `
        🔹 <b>Pengertian:</b> HDD adalah perangkat penyimpanan magnetik yang menyimpan file, sistem operasi, dan program komputer.
        <br><br>
        🔹 <b>Komponen Utama:</b> Piringan magnetik, head pembaca, motor spindle, dan board kontrol.
        <br><br>
        🔹 <b>Fungsi/Manfaat:</b> Menyimpan data secara permanen, walau komputer dimatikan.
        <br><br>
        🔹 <b>Macam/Contoh:</b> HDD 5400 RPM, 7200 RPM, SSHD (Hybrid).
        <br><br>
        💡 <b>Fakta Menarik:</b> HDD bekerja seperti piringan CD yang berputar, dan head-nya membaca data tanpa menyentuh langsung permukaan piringan!
      `
    },
    "PSU": {
      text: "Power Supply Unit (PSU) adalah alat yang mengubah listrik AC menjadi DC untuk komponen komputer.",
      fullInfo: `
        🔹 <b>Pengertian:</b> PSU menyuplai daya listrik yang stabil ke semua komponen komputer seperti CPU, GPU, dan motherboard.
        <br><br>
        🔹 <b>Komponen Utama:</b> Transformator, kipas pendingin, kapasitor, dan konektor daya.
        <br><br>
        🔹 <b>Fungsi/Manfaat:</b> Menyediakan daya dengan tegangan yang sesuai agar komputer berfungsi dengan aman.
        <br><br>
        🔹 <b>Macam/Contoh:</b> ATX, SFX, Modular dan Non-Modular PSU.
        <br><br>
        💡 <b>Fakta Menarik:</b> PSU yang bagus punya sertifikasi 80 Plus, artinya lebih hemat listrik dan efisien.
      `
    },
    "Motherboard": {
      text: "Motherboard adalah papan utama tempat semua komponen komputer terhubung dan berkomunikasi.",
      fullInfo: `
        🔹 <b>Pengertian:</b> Motherboard adalah pusat koneksi antar perangkat keras seperti CPU, RAM, penyimpanan, dan kartu ekspansi.
        <br><br>
        🔹 <b>Komponen Utama:</b> Socket CPU, slot RAM, chipset, port I/O, dan slot PCIe.
        <br><br>
        🔹 <b>Fungsi/Manfaat:</b> Menghubungkan dan mengatur komunikasi antar semua perangkat komputer.
        <br><br>
        🔹 <b>Macam/Contoh:</b> ATX, Micro-ATX, Mini-ITX.
        <br><br>
        💡 <b>Fakta Menarik:</b> Chipset di motherboard menentukan jenis prosesor dan RAM yang bisa digunakan.
      `
    }
  };

  if (!isExpanded) {
    popupText.innerHTML = hardwareInfo[titleKey]?.fullInfo || "ℹ Info lengkap belum tersedia untuk komponen ini.";
    infoBox.classList.add("expanded");
    closeInfoBtn.innerText = "Tutup Info";
  } else {
    popupText.innerText = hardwareInfo[titleKey]?.text || "Info singkat tidak tersedia.";
    infoBox.classList.remove("expanded");
    closeInfoBtn.innerText = "ℹ Info Lengkap";
  }

  // 🎤 Tambahkan suara sesuai isi popup (persis teksnya)
  speak(popupText.innerText || popupText.textContent);
});

// 📸 Tombol Capture
// 📸 Tombol Capture — hasil tajam & fokus kamera + infoBox
document.getElementById("captureBtn").addEventListener("click", () => {
  const captureArea = document.querySelector(".camera-container");
  const infoBox = document.getElementById("infoBox");

  if (!captureArea || !infoBox) {
    alert("❌ Elemen kamera atau infoBox tidak ditemukan!");
    return;
  }

  // Simpan style asli
  const originalStyle = {
    opacity: infoBox.style.opacity,
    backgroundColor: infoBox.style.backgroundColor,
    backdropFilter: infoBox.style.backdropFilter,
    color: infoBox.style.color,
    boxShadow: infoBox.style.boxShadow,
    transform: infoBox.style.transform,
    filter: infoBox.style.filter,
  };

  // 🔍 Buat teks superjelas & kontras tinggi saat di-capture
  infoBox.style.opacity = "1";
  infoBox.style.backgroundColor = "#ffffff";
  infoBox.style.backdropFilter = "none";
  infoBox.style.color = "#000000";
  infoBox.style.boxShadow = "none";
  infoBox.style.filter = "contrast(120%) brightness(110%)";
  infoBox.style.transform = "scale(1.02)"; // sedikit besar biar huruf halus

  // 📸 Ambil tangkapan layar area kamera + infobox saja
  html2canvas(captureArea, {
    scale: 3, // resolusi lebih tinggi (3x)
    backgroundColor: "#ffffff", // latar belakang putih bersih
    useCORS: true,
    allowTaint: true,
    logging: false,
  })
    .then((canvas) => {
      const link = document.createElement("a");
      link.download = "hasil-scan.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    })
    .catch((err) => {
      console.error("Gagal mengambil gambar:", err);
      alert("❌ Gagal mengambil gambar. Coba lagi ya!");
    })
    .finally(() => {
      // 🔄 Kembalikan tampilan semula
      Object.keys(originalStyle).forEach((key) => {
        infoBox.style[key] = originalStyle[key];
      });
    });
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

// 🔍 Tentang Proyek
document.getElementById("aboutBtn").addEventListener("click", () => {
  const infoBox = document.getElementById("infoBox");
  const popupTitle = document.getElementById("popupTitle");
  const popupText = document.getElementById("popupText");
  const closeInfoBtn = document.getElementById("closeInfo");

  popupTitle.innerText = "Tentang Proyek AI Scanner 🧠";
  popupText.innerHTML = `
    <b>AI Scanner Hardware Komputer</b> adalah proyek pembelajaran interaktif
    berbasis web yang menggunakan <b>Teachable Machine</b> untuk mengenali
    komponen hardware seperti CPU, RAM, Harddisk, Power Supply, dan Motherboard.
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
  infoBox.classList.remove("expanded");
  closeInfoBtn.innerText = "Tutup Info";
});

// 🔘 Tutup Info otomatis
document.getElementById("closeInfo").addEventListener("click", () => {
  const infoBox = document.getElementById("infoBox");
  infoBox.style.display = "none";
});

// ⏯ Jalankan pertama kali
init(); 
