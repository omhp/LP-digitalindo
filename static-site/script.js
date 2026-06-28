// Digitalindo - Vanilla JS interactions

// ---------- Helpers ----------
function formatRupiah(num) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const icon = document.getElementById("toast-icon");
  document.getElementById("toast-msg").textContent = message;
  if (type === "success") {
    icon.className = "w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-600";
    icon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
  } else {
    icon.className = "w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-rose-100 text-rose-600";
    icon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  }
  toast.classList.remove("hidden");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.add("hidden"), 4000);
}

// ---------- Lead Modal ----------
function openLeadModal(desc) {
  if (desc) document.getElementById("lead-desc").value = desc;
  document.getElementById("lead-modal").classList.remove("hidden");
  document.getElementById("lead-success").classList.add("hidden");
  document.getElementById("lead-form").classList.remove("hidden");
  document.getElementById("lead-error").classList.add("hidden");
}

function closeLeadModal() {
  document.getElementById("lead-modal").classList.add("hidden");
}

document.getElementById("lead-modal").addEventListener("click", (e) => {
  if (e.target.id === "lead-modal") closeLeadModal();
});

document.getElementById("lead-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("lead-name").value.trim();
  const business = document.getElementById("lead-business").value.trim();
  const phone = document.getElementById("lead-phone").value.trim();
  const err = document.getElementById("lead-error");
  if (!name || !business || !phone) {
    err.textContent = "Mohon isi Nama, Nama Bisnis, dan No. WhatsApp.";
    err.classList.remove("hidden");
    return;
  }
  err.classList.add("hidden");
  document.getElementById("lead-form").classList.add("hidden");
  document.getElementById("lead-success").classList.remove("hidden");
  showToast("Pendaftaran konsultasi Anda berhasil dikirim!", "success");
  document.getElementById("lead-form").reset();
});

// Service card CTA buttons
document.querySelectorAll(".service-cta").forEach((btn) => {
  btn.addEventListener("click", () => {
    openLeadModal("Tertarik dengan layanan: " + btn.dataset.service);
  });
});

// ---------- Calculator ----------
let calcInitial = 15000000;
let calcMult = 3;

function updateCalc() {
  const potential = calcInitial * calcMult;
  const net = potential - calcInitial;
  document.getElementById("calc-initial-display").textContent = formatRupiah(calcInitial);
  document.getElementById("calc-result").textContent = formatRupiah(potential);
  document.getElementById("calc-net").textContent = "+" + formatRupiah(net);
  document.getElementById("calc-growth").textContent = "+" + (calcMult * 100 - 100) + "%";
}

document.getElementById("calc-slider").addEventListener("input", (e) => {
  calcInitial = Number(e.target.value);
  updateCalc();
});

document.querySelectorAll(".mult-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    calcMult = Number(btn.dataset.mult);
    document.querySelectorAll(".mult-btn").forEach((b) => {
      b.className = "mult-btn py-2 px-3 rounded-xl font-bold text-sm transition-all duration-300 bg-white text-slate-600 border border-slate-200 hover:bg-slate-100";
    });
    btn.className = "mult-btn py-2 px-3 rounded-xl font-bold text-sm transition-all duration-300 bg-slate-900 text-white shadow-md";
    updateCalc();
  });
});

function claimCalc() {
  openLeadModal("Omset saat ini " + formatRupiah(calcInitial) + ", ingin naik " + calcMult + "x lipat!");
}
window.claimCalc = claimCalc;

updateCalc();

// ---------- AI Strategy Generator (client-side simulation) ----------
function buildStrategy(name, category, audience) {
  return (
    "Strategi Pemasaran Digital untuk " + name + " (" + category + ")\n\n" +
    "LANGKAH 1 — Branding & Media Sosial\n" +
    "• Buat akun Instagram & TikTok bisnis dengan nama, logo, dan bio yang jelas untuk " + name + ".\n" +
    "• Posting konten konsisten 3-4x seminggu: foto produk, behind the scenes, dan testimoni pelanggan.\n" +
    "• Gunakan bahasa yang relevan dengan " + audience + " agar terasa dekat dan dipercaya.\n\n" +
    "LANGKAH 2 — Tingkatkan Penjualan\n" +
    "• Buat penawaran pembuka, misalnya diskon 15% untuk pembeli pertama atau bundling hemat.\n" +
    "• Tampilkan copywriting yang menonjolkan manfaat utama produk bagi " + audience + ".\n" +
    "• Aktifkan WhatsApp Business dengan katalog & balasan cepat untuk mempermudah pemesanan.\n\n" +
    "LANGKAH 3 — Iklan & Jangkauan Pelanggan Baru\n" +
    "• Mulai Meta Ads dengan budget Rp 25.000/hari, targetkan " + audience + ".\n" +
    "• Optimalkan Google Business Profile agar " + name + " muncul di pencarian lokal.\n" +
    "• Pantau hasil tiap minggu dan alihkan budget ke iklan dengan performa terbaik.\n\n" +
    "Konsisten menjalankan 3 langkah ini akan membantu " + name + " menjangkau lebih banyak pelanggan dan meningkatkan omset secara bertahap."
  );
}

document.getElementById("ai-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("ai-business-name").value.trim();
  const category = document.getElementById("ai-business-category").value.trim();
  const audience = document.getElementById("ai-target-audience").value.trim();
  if (!name || !category || !audience) {
    showToast("Mohon lengkapi semua data formulir.", "error");
    return;
  }

  const empty = document.getElementById("ai-empty");
  const output = document.getElementById("ai-output");
  const status = document.getElementById("ai-status");
  const done = document.getElementById("ai-done");
  const footer = document.getElementById("ai-footer");
  const btn = document.getElementById("ai-generate-btn");

  empty.classList.add("hidden");
  output.classList.remove("hidden");
  output.textContent = "";
  status.classList.remove("hidden");
  done.classList.add("hidden");
  footer.classList.add("hidden");
  btn.disabled = true;
  btn.classList.add("opacity-60");

  const fullText = buildStrategy(name, category, audience);
  let i = 0;
  clearInterval(window.__aiTimer);
  window.__aiTimer = setInterval(() => {
    output.textContent += fullText.slice(i, i + 4);
    i += 4;
    output.scrollTop = output.scrollHeight;
    if (i >= fullText.length) {
      clearInterval(window.__aiTimer);
      status.classList.add("hidden");
      done.classList.remove("hidden");
      footer.classList.remove("hidden");
      btn.disabled = false;
      btn.classList.remove("opacity-60");
      showToast("Strategi pemasaran Anda selesai dibuat!", "success");
    }
  }, 12);
});

function resetAi() {
  document.getElementById("ai-form").reset();
  document.getElementById("ai-output").classList.add("hidden");
  document.getElementById("ai-output").textContent = "";
  document.getElementById("ai-empty").classList.remove("hidden");
  document.getElementById("ai-status").classList.add("hidden");
  document.getElementById("ai-done").classList.add("hidden");
  document.getElementById("ai-footer").classList.add("hidden");
}
window.resetAi = resetAi;
window.openLeadModal = openLeadModal;
window.closeLeadModal = closeLeadModal;
