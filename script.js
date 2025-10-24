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
  if (!text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "id-ID";
  window.speechSynthesis.cancel(); // biar gak numpuk
  window.speechSynthesis.speak(utterance);
}

// 🚀 Inisialisasi model & kamera
async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  const flip = true;
  webcam = new tmImage.Webcam(250, 250, flip);
  await webcam.setup();
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

  if (bestPrediction.probability > 0.95) {
    const name = bestPrediction.className.trim();
    const info = getHardwareInfo(name);

    // efek visual
    if (webcamCanvas) webcamCanvas.style.boxShadow = "0 0 20px lime";
    const status = document.getElementById("status");
    status.innerHTML = `✅ ${name} terdeteksi!`;
    status.style.color = "lime";

    // suara
    if (!window.speaking || window.lastSpoken !== name) {
      speak(info ? info.sound : "Komponen ini belum terdaftar.");
      window.speaking = true;
      window.lastSpoken = name;
      setTimeout(() => (window.speaking = false), 4000);
    }

    // snapshot hasil
    const snapshot = webcam.canvas.toDataURL("image/png");
    const img = new Image();
    img.src = snapshot;
    img.style.width = "480px";
    img.style.borderRadius = "10px";
    img.style.objectFit = "cover";
    img.style.transition = "all 0.4s ease";

    // stop kamera
    try {
      webcam.stop();
    } catch (err) {
      console.error("Gagal matikan kamera:", err);
    }

    const webcamDiv = document.getElementById("webcam");
    webcamDiv.innerHTML = "";
    webcamDiv.appendChild(img);

    // tampilkan info
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

// 🎯 Tombol Info Lengkap (FIX FINAL)
const closeInfoBtn = document.getElementById("closeInfo");
closeInfoBtn.addEventListener("click", () => {
  const infoBox = document.getElementById("infoBox");
  const titleRaw = document.getElementById("popupTitle").innerText.trim().toLowerCase();
  const popupText = document.getElementById("popupText");
  const isExpanded = infoBox.classList.contains("expanded");

  // Normalisasi nama supaya cocok ke key
  let titleKey = "";
  if (titleRaw.includes("cpu")) titleKey = "CPU";
  else if (titleRaw.includes("ram")) titleKey = "RAM";
  else if (titleRaw.includes("hard") || titleRaw.includes("disk")) titleKey = "HDD";
  else if (titleRaw.includes("power") || titleRaw.includes("psu")) titleKey = "PSU";
  else if (titleRaw.includes("mother") || titleRaw.includes("board")) titleKey = "Motherboard";

  // Data info lengkap
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

  // 🔹 Ganti isi popup tergantung kondisi
  if (!isExpanded) {
    if (hardwareInfo[titleKey]?.fullInfo) {
      popupText.innerHTML = hardwareInfo[titleKey].fullInfo;
    } else {
      popupText.innerText = "ℹ Info lengkap belum tersedia untuk komponen ini.";
    }
    infoBox.classList.add("expanded");
    closeInfoBtn.innerText = "Tutup Info";
  } else {
    popupText.innerText = hardwareInfo[titleKey]?.text || "Info singkat tidak tersedia.";
    infoBox.classList.remove("expanded");
    closeInfoBtn.innerText = "ℹ Info Lengkap";
  }
});

// 📸 Tombol Capture
document.getElementById("captureBtn").addEventListener("click", () => {
  const webcamArea = document.querySelector(".camera-container");
  html2canvas(webcamArea)
    .then((canvas) => {
      const link = document.createElement("a");
      link.download = "hasil-scan.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    })
    .catch((err) => {
      console.error("Gagal mengambil gambar:", err);
      alert("❌ Gagal mengambil gambar. Coba lagi ya!");
    });
});

// ⏯ Jalankan pertama kali
init();
