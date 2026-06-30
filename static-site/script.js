// Digitalindo - static site interactions

function formatRupiah(num) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
}

function showToast(message, type) {
  type = type || "success";
  var toast = document.getElementById("toast");
  var icon = document.getElementById("toast-icon");
  document.getElementById("toast-msg").textContent = message;
  if (type === "success") {
    icon.className = "ico ok";
    icon.innerHTML = '<svg class="ic"><use href="#i-check"/></svg>';
  } else {
    icon.className = "ico err";
    icon.innerHTML = '<svg class="ic"><use href="#i-x"/></svg>';
  }
  toast.classList.remove("hidden");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(function () { toast.classList.add("hidden"); }, 4000);
}

// ---------- Lead Modal ----------
function openLeadModal(desc) {
  if (desc) document.getElementById("lead-desc").value = desc;
  document.getElementById("lead-modal").classList.remove("hidden");
  document.getElementById("lead-success").classList.add("hidden");
  document.getElementById("lead-form").classList.remove("hidden");
  document.getElementById("lead-error").classList.add("hidden");
}
function closeLeadModal() { document.getElementById("lead-modal").classList.add("hidden"); }
window.openLeadModal = openLeadModal;
window.closeLeadModal = closeLeadModal;

document.getElementById("lead-modal").addEventListener("click", function (e) {
  if (e.target.id === "lead-modal") closeLeadModal();
});

document.getElementById("lead-form").addEventListener("submit", function (e) {
  e.preventDefault();
  var name = document.getElementById("lead-name").value.trim();
  var business = document.getElementById("lead-business").value.trim();
  var phone = document.getElementById("lead-phone").value.trim();
  var err = document.getElementById("lead-error");
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

// Service CTA buttons
var ctas = document.querySelectorAll(".service-cta");
for (var i = 0; i < ctas.length; i++) {
  ctas[i].addEventListener("click", function () {
    openLeadModal("Tertarik dengan layanan: " + this.dataset.service);
  });
}

// ---------- Calculator ----------
var calcInitial = 15000000;
var calcMult = 3;

function updateCalc() {
  var potential = calcInitial * calcMult;
  document.getElementById("calc-initial-display").textContent = formatRupiah(calcInitial);
  document.getElementById("calc-result").textContent = formatRupiah(potential);
  document.getElementById("calc-net").textContent = "+" + formatRupiah(potential - calcInitial);
  document.getElementById("calc-growth").textContent = "+" + (calcMult * 100 - 100) + "%";
}

document.getElementById("calc-slider").addEventListener("input", function (e) {
  calcInitial = Number(e.target.value);
  updateCalc();
});

var multBtns = document.querySelectorAll(".mult-btn");
for (var j = 0; j < multBtns.length; j++) {
  multBtns[j].addEventListener("click", function () {
    calcMult = Number(this.dataset.mult);
    for (var k = 0; k < multBtns.length; k++) multBtns[k].classList.remove("active");
    this.classList.add("active");
    updateCalc();
  });
}

function claimCalc() {
  openLeadModal("Omset saat ini " + formatRupiah(calcInitial) + ", ingin naik " + calcMult + "x lipat!");
}
window.claimCalc = claimCalc;
updateCalc();

// ---------- AI Strategy (client-side) ----------
function buildStrategy(name, category, audience) {
  return (
    "Strategi Pemasaran Digital untuk " + name + " (" + category + ")\n\n" +
    "LANGKAH 1 - Branding & Media Sosial\n" +
    "- Buat akun Instagram & TikTok bisnis dengan nama, logo, dan bio yang jelas untuk " + name + ".\n" +
    "- Posting konten konsisten 3-4x seminggu: foto produk, behind the scenes, dan testimoni pelanggan.\n" +
    "- Gunakan bahasa yang relevan dengan " + audience + " agar terasa dekat dan dipercaya.\n\n" +
    "LANGKAH 2 - Tingkatkan Penjualan\n" +
    "- Buat penawaran pembuka, misalnya diskon 15% untuk pembeli pertama atau bundling hemat.\n" +
    "- Tampilkan copywriting yang menonjolkan manfaat utama produk bagi " + audience + ".\n" +
    "- Aktifkan WhatsApp Business dengan katalog & balasan cepat untuk mempermudah pemesanan.\n\n" +
    "LANGKAH 3 - Iklan & Jangkauan Pelanggan Baru\n" +
    "- Mulai Meta Ads dengan budget Rp 25.000/hari, targetkan " + audience + ".\n" +
    "- Optimalkan Google Business Profile agar " + name + " muncul di pencarian lokal.\n" +
    "- Pantau hasil tiap minggu dan alihkan budget ke iklan dengan performa terbaik.\n\n" +
    "Konsisten menjalankan 3 langkah ini akan membantu " + name + " menjangkau lebih banyak pelanggan dan meningkatkan omset secara bertahap."
  );
}

document.getElementById("ai-form").addEventListener("submit", function (e) {
  e.preventDefault();
  var name = document.getElementById("ai-business-name").value.trim();
  var category = document.getElementById("ai-business-category").value.trim();
  var audience = document.getElementById("ai-target-audience").value.trim();
  if (!name || !category || !audience) { showToast("Mohon lengkapi semua data formulir.", "error"); return; }

  var empty = document.getElementById("ai-empty");
  var output = document.getElementById("ai-output");
  var status = document.getElementById("ai-status");
  var done = document.getElementById("ai-done");
  var footer = document.getElementById("ai-footer");
  var btn = document.getElementById("ai-generate-btn");

  empty.classList.add("hidden");
  output.classList.remove("hidden");
  output.textContent = "";
  status.classList.remove("hidden");
  done.classList.add("hidden");
  footer.classList.add("hidden");
  btn.disabled = true;
  btn.style.opacity = ".6";

  var fullText = buildStrategy(name, category, audience);
  var idx = 0;
  clearInterval(window.__aiTimer);
  window.__aiTimer = setInterval(function () {
    output.textContent += fullText.slice(idx, idx + 4);
    idx += 4;
    output.scrollTop = output.scrollHeight;
    if (idx >= fullText.length) {
      clearInterval(window.__aiTimer);
      status.classList.add("hidden");
      done.classList.remove("hidden");
      footer.classList.remove("hidden");
      btn.disabled = false;
      btn.style.opacity = "1";
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
