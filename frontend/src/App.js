import React, { useState, useEffect, useRef } from "react";
import "@/App.css";
import { 
  CheckCircle, 
  TrendingUp, 
  Sparkles, 
  Users, 
  Award, 
  ShieldCheck, 
  ArrowRight, 
  X, 
  Loader2, 
  Calculator, 
  ChevronRight, 
  PhoneCall,
  RefreshCw,
  Clock,
  Briefcase
} from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

export default function App() {
  // Modal Leads states
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: "",
    business_name: "",
    email: "",
    phone: "",
    business_desc: ""
  });
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [leadError, setLeadError] = useState("");

  // AI Brief generator states
  const [aiForm, setAiForm] = useState({
    business_name: "",
    business_category: "",
    target_audience: ""
  });
  const [aiOutput, setAiOutput] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiBriefId, setAiBriefId] = useState("");
  const [briefHistory, setBriefHistory] = useState([]);
  const [selectedBrief, setSelectedBrief] = useState(null);

  // Calculator states
  const [initialRevenue, setInitialRevenue] = useState(15000000); // 15jt
  const [growthMultiplier, setGrowthMultiplier] = useState(3.0); // 3x growth

  // Notification / Toast states
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success"
  });

  const aiOutputRef = useRef(null);

  // Load history briefs on mount
  useEffect(() => {
    fetchBriefHistory();
  }, []);

  // Scroll to output when generating
  useEffect(() => {
    if (aiOutputRef.current && aiGenerating) {
      aiOutputRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiOutput, aiGenerating]);

  const fetchBriefHistory = async () => {
    try {
      const response = await axios.get(`${API}/marketing/briefs`);
      setBriefHistory(response.data);
    } catch (err) {
      console.error("Gagal memuat riwayat brief", err);
    }
  };

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLeadForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAiInputChange = (e) => {
    const { name, value } = e.target;
    setAiForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.business_name || !leadForm.phone) {
      setLeadError("Mohon isi Nama, Nama Bisnis, dan No. WhatsApp.");
      return;
    }
    setLeadSubmitting(true);
    setLeadError("");
    try {
      await axios.post(`${API}/leads`, {
        name: leadForm.name,
        business_name: leadForm.business_name,
        email: leadForm.email || `${leadForm.business_name.toLowerCase().replace(/\s+/g, '')}@example.com`,
        phone: leadForm.phone,
        business_desc: leadForm.business_desc || "Konsultasi Pemasaran Digital"
      });
      setLeadSuccess(true);
      triggerToast("Pendaftaran konsultasi Anda berhasil dikirim!", "success");
      setLeadForm({ name: "", business_name: "", email: "", phone: "", business_desc: "" });
    } catch (err) {
      console.error(err);
      setLeadError("Gagal mengirim data. Silakan coba lagi beberapa saat lagi.");
      triggerToast("Gagal menyimpan data konsultasi.", "error");
    } finally {
      setLeadSubmitting(false);
    }
  };

  const handleAiGenerate = async (e) => {
    e.preventDefault();
    if (!aiForm.business_name || !aiForm.business_category || !aiForm.target_audience) {
      triggerToast("Mohon lengkapi semua data formulir AI.", "error");
      return;
    }

    setAiGenerating(true);
    setAiOutput("");
    setAiBriefId("");
    setSelectedBrief(null);

    try {
      const response = await fetch(`${API}/marketing/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_name: aiForm.business_name,
          business_category: aiForm.business_category,
          target_audience: aiForm.target_audience,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal terhubung ke server AI.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: !done });
        
        // Parse SSE payload
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.slice(6).trim();
              if (jsonStr) {
                const parsed = JSON.parse(jsonStr);
                if (parsed.content) {
                  setAiOutput((prev) => prev + parsed.content);
                }
                if (parsed.done) {
                  setAiBriefId(parsed.id);
                  triggerToast("Strategi pemasaran Anda selesai dibuat!", "success");
                }
                if (parsed.error) {
                  setAiOutput((prev) => prev + `\n\n[Kesalahan: ${parsed.error}]`);
                  triggerToast(parsed.error, "error");
                }
              }
            } catch (pErr) {
              console.error("Kesalahan parsing baris SSE", pErr);
            }
          }
        }
      }

      // Reload history to include the new one
      fetchBriefHistory();
    } catch (err) {
      console.error(err);
      setAiOutput("Maaf, terjadi masalah saat menghubungi asisten AI kami. Silakan coba lagi.");
      triggerToast("Gagal menghasilkan strategi pemasaran AI.", "error");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSelectHistoryBrief = (brief) => {
    setSelectedBrief(brief);
    setAiOutput(brief.brief_content);
    setAiBriefId(brief.id);
    setAiForm({
      business_name: brief.business_name,
      business_category: brief.business_category,
      target_audience: brief.target_audience
    });
    
    if (aiOutputRef.current) {
      aiOutputRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleResetAi = () => {
    setAiForm({ business_name: "", business_category: "", target_audience: "" });
    setAiOutput("");
    setAiBriefId("");
    setSelectedBrief(null);
  };

  // Helper to format currency
  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const potentialRevenue = initialRevenue * growthMultiplier;
  const netIncrease = potentialRevenue - initialRevenue;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-[#0F172A]">
      {/* Top Banner / Trust Certification Bar */}
      <div className="bg-[#0F172A] text-white py-2 px-4 text-xs sm:text-sm flex flex-wrap justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-2" data-testid="trust-credibility">
          <Award className="w-4 h-4 text-orange-500" />
          <span>Google & Meta Certified Partner</span>
          <span className="hidden sm:inline text-white/40">|</span>
          <span className="hidden sm:inline text-orange-500 font-semibold" data-testid="trust-risk-reversal">Garansi Strategi Terbukti Efektif</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-white/70">Butuh bantuan mendesak?</span>
          <a 
            href="https://wa.me/628123456789" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-orange-500 font-bold hover:underline"
            data-testid="header-whatsapp-link"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Chat WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-orange-600/30">
            D
          </div>
          <div>
            <span className="font-heading text-xl font-extrabold tracking-tight block text-slate-900" data-testid="brand-logo-digitalindo">
              Digitalindo
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-orange-600 -mt-1 block">
              Digital Khusus UMKM
            </span>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-600">
          <a href="#calculator" className="hover:text-orange-600 transition-colors">Kalkulator Omset</a>
          <a href="#ai-generator" className="hover:text-orange-600 transition-colors">Rekomendasi AI</a>
          <a href="#benefits" className="hover:text-orange-600 transition-colors">Keunggulan</a>
          <a href="#history" className="hover:text-orange-600 transition-colors">Riwayat UMKM</a>
        </nav>
        <button 
          onClick={() => setShowLeadModal(true)}
          className="bg-slate-900 text-white hover:bg-orange-600 hover:text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-orange-600/20 flex items-center gap-2 group"
          data-testid="header-cta-button"
        >
          <span>Mulai Sekarang</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </header>

      {/* HERO SECTION - Split Layout (50/50) */}
      <section className="relative bg-grid-pattern py-12 md:py-20 px-6 md:px-12 lg:px-24 overflow-hidden border-b border-slate-200">
        {/* Background glow styling */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-100/40 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-50/50 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Copywriting Narrative */}
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-800 text-xs font-bold rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
              <span>Digital Marketing Khusus UMKM</span>
            </div>

            <h1 
              className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight"
              data-testid="hero-main-headline"
            >
              Ledakkan Penjualan UMKM Anda dengan Digital Marketing
            </h1>

            <p 
              className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans"
              data-testid="hero-sub-headline"
            >
              Kami membantu UMKM meningkatkan penjualan, membangun brand kuat, dan menjangkau ribuan pelanggan baru melalui strategi pemasaran digital yang terbukti efektif.
            </p>

            {/* Supporting Points - Key Benefits */}
            <div className="space-y-3.5">
              <div className="flex items-start gap-3" data-testid="supporting-point-0">
                <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Tingkatkan Penjualan Hingga 300%</h3>
                  <p className="text-slate-500 text-sm">Metode teruji dan disesuaikan untuk skala mikro & kecil.</p>
                </div>
              </div>
              <div className="flex items-start gap-3" data-testid="supporting-point-1">
                <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Jangkau Ribuan Pelanggan Baru</h3>
                  <p className="text-slate-500 text-sm">Target audiens lokal yang tepat sasaran di sekitar gerai Anda.</p>
                </div>
              </div>
              <div className="flex items-start gap-3" data-testid="supporting-point-2">
                <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Bangun Brand yang Kuat</h3>
                  <p className="text-slate-500 text-sm">Identitas profesional yang membuat UMKM dipercaya & bersaing.</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons Block */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={() => setShowLeadModal(true)}
                className="bg-[#EA580C] text-white hover:bg-orange-600 px-8 py-4 rounded-2xl font-bold text-base md:text-lg text-center transition-all duration-300 shadow-xl shadow-orange-600/30 hover:shadow-orange-600/40 animate-pulse-subtle active:scale-95"
                data-testid="hero-primary-cta-button"
              >
                Konsultasi Gratis Sekarang
              </button>
              
              <a
                href="#calculator"
                className="bg-white text-slate-900 border-2 border-slate-200 hover:border-orange-500 px-6 py-4 rounded-2xl font-bold text-base text-center transition-all duration-300 flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-95"
                data-testid="hero-secondary-cta-button"
              >
                <Calculator className="w-5 h-5 text-slate-500" />
                <span>Hitung Potensi Omset</span>
              </a>
            </div>

            {/* Social Proof Trust Indicator */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-4">
              <div className="flex -space-x-3">
                <img className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" alt="UMKM Owner" />
                <img className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" alt="UMKM Owner" />
                <img className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" alt="UMKM Owner" />
              </div>
              <div className="text-sm">
                <p className="font-extrabold text-slate-900" data-testid="trust-social-proof">Dipercaya 500+ UMKM Indonesia</p>
                <p className="text-slate-500">Mulai dari kafe kuliner, fashion, hingga jasa lokal.</p>
              </div>
            </div>

          </div>

          {/* Right Column: Confident MSME Owner overlapping with Digital Growth Metrics Card */}
          <div className="relative flex justify-center items-center lg:h-[550px] animate-fade-in-up animation-delay-200">
            {/* Visual background circle decoration */}
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-200/50 to-blue-200/40 rounded-3xl -z-10 rotate-3 transform scale-95 lg:scale-105"></div>
            
            {/* Base Cafe Owner Image */}
            <div className="relative w-full max-w-[460px] h-[340px] sm:h-[420px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform transition-all duration-500 hover:rotate-1 hover:scale-[1.02]">
              <img 
                src="https://images.pexels.com/photos/36729739/pexels-photo-36729739.jpeg" 
                alt="Pemilik Cafe UMKM Sukses" 
                className="w-full h-full object-cover"
                data-testid="hero-owner-image"
              />
              {/* Subtle overlay shading */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>
              
              {/* Overlay brand badge */}
              <div className="absolute bottom-4 left-4 bg-slate-900/90 text-white px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm">
                Warung Kopi Sejahtera • Mitra Digitalindo
              </div>
            </div>

            {/* Overlapping Glassmorphism Floating Analytics Card */}
            <div 
              className="absolute -bottom-8 -left-2 sm:left-4 md:-left-8 max-w-[280px] rounded-2xl shadow-xl glass-card p-4 animate-float border border-white"
              data-testid="hero-analytics-overlay"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Hasil Kampanye</span>
                  <span className="font-heading font-extrabold text-slate-800 text-sm">Omset Naik +300%</span>
                </div>
              </div>
              
              {/* Floating Card Image Asset */}
              <div className="w-full h-24 rounded-lg overflow-hidden relative mb-2">
                <img 
                  src="https://images.pexels.com/photos/106344/pexels-photo-106344.jpeg" 
                  alt="Grafik Kenaikan Penjualan" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-orange-600/10 mix-blend-multiply"></div>
              </div>
              
              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span>Anggaran: Rp 25.000/hari</span>
                <span className="text-emerald-600 font-bold">Sangat Efisien!</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* CALCULATOR SECTION */}
      <section id="calculator" className="py-16 px-6 md:px-12 bg-white border-b border-slate-200" data-testid="roi-calculator-section">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-3 mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 text-xs font-bold rounded-full">
              <Calculator className="w-3.5 h-3.5 text-blue-600" />
              <span>Simulasi Omset Bisnis</span>
            </div>
            <h2 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">
              Hitung Potensi Kenaikan Omset Anda
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
              Geser nilai omset bulanan Anda sekarang untuk melihat estimasi pertumbuhan omset setelah dikelola secara digital oleh Digitalindo.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center shadow-sm">
            {/* Input Side */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-semibold">Omset Bulanan Saat Ini:</span>
                  <span className="text-slate-900 font-extrabold text-base">{formatRupiah(initialRevenue)}</span>
                </div>
                <input 
                  type="range" 
                  min="5000000" 
                  max="100000000" 
                  step="5000000"
                  value={initialRevenue}
                  onChange={(e) => setInitialRevenue(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                  data-testid="calc-initial-revenue-input"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>Rp 5 Juta</span>
                  <span>Rp 50 Juta</span>
                  <span>Rp 100 Juta</span>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-sm text-slate-600 font-semibold block">Target Kenaikan Pemasaran:</span>
                <div className="grid grid-cols-3 gap-2" data-testid="calc-growth-multiplier">
                  {[2.0, 3.0, 4.0].map((multiplier) => (
                    <button
                      key={multiplier}
                      type="button"
                      onClick={() => setGrowthMultiplier(multiplier)}
                      className={`py-2 px-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                        growthMultiplier === multiplier 
                          ? "bg-slate-900 text-white shadow-md" 
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {multiplier}x Lipat
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Output Display Side */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-full min-h-[220px]">
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-orange-600/10 rounded-full blur-xl"></div>
              
              <div className="space-y-1">
                <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Estimasi Omset Baru</span>
                <div className="text-3xl sm:text-4xl font-heading font-extrabold text-orange-500 animate-pulse" data-testid="calc-result-value">
                  {formatRupiah(potentialRevenue)}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-white/10 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Tambahan Keuntungan:</span>
                  <span className="text-emerald-400 font-bold">+{formatRupiah(netIncrease)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Tingkat Pertumbuhan:</span>
                  <span className="text-orange-400 font-bold">+{growthMultiplier * 100 - 100}%</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setLeadForm((prev) => ({
                    ...prev,
                    business_desc: `Omset saat ini ${formatRupiah(initialRevenue)}, ingin naik ${growthMultiplier}x lipat!`
                  }));
                  setShowLeadModal(true);
                }}
                className="mt-4 bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl text-center transition-all duration-300 flex items-center justify-center gap-1.5 group"
                data-testid="calc-trigger-consultation-btn"
              >
                <span>Klaim Hasil Omset Ini</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* AI STRATEGIC BRIEF GENERATOR */}
      <section id="ai-generator" className="py-16 px-6 md:px-12 bg-[#F8FAFC] border-b border-slate-200" data-testid="ai-generator-section">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-3 mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>Teknologi AI Digitalindo</span>
            </div>
            <h2 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">
              Asisten Strategi AI Khusus UMKM Anda
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
              Masukkan bisnis Anda dan biarkan AI kami merumuskan taktik pemasaran digital 3 langkah berbiaya rendah secara instan!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Input Form Column */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              <h3 className="font-heading font-extrabold text-slate-900 text-lg flex items-center justify-between">
                <span>Rancang Rencana</span>
                <button 
                  onClick={handleResetAi}
                  className="text-slate-400 hover:text-orange-600 text-xs flex items-center gap-1"
                  data-testid="ai-reset-button"
                  title="Reset form"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </h3>

              <form onSubmit={handleAiGenerate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nama Bisnis Anda</label>
                  <input 
                    type="text"
                    name="business_name"
                    value={aiForm.business_name}
                    onChange={handleAiInputChange}
                    placeholder="Contoh: Kopi Kulo, Hijab Cantik"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    data-testid="ai-business-name-input"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Kategori/Bidang Bisnis</label>
                  <input 
                    type="text"
                    name="business_category"
                    value={aiForm.business_category}
                    onChange={handleAiInputChange}
                    placeholder="Contoh: Kedai Kopi, Fashion Muslim, Jasa Laundry"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    data-testid="ai-business-category-input"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Target Pelanggan</label>
                  <input 
                    type="text"
                    name="target_audience"
                    value={aiForm.target_audience}
                    onChange={handleAiInputChange}
                    placeholder="Contoh: Mahasiswa sekitar Depok, Ibu rumah tangga muda"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    data-testid="ai-target-audience-input"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={aiGenerating}
                  className="w-full bg-[#EA580C] hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 active:scale-[0.98]"
                  data-testid="ai-generate-button"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sedang Merumuskan...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Buatkan Strategi AI Sekarang</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Live Streaming Output Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Output block */}
              <div 
                ref={aiOutputRef}
                className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 min-h-[340px] flex flex-col justify-between shadow-inner relative overflow-hidden"
              >
                {/* Visual grid inside output for high-tech digital vibe */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                      <span data-testid="ai-strategy-title">Rencana Strategis Khusus</span>
                    </span>
                    {aiGenerating && (
                      <span className="text-orange-500 text-xs font-bold animate-pulse flex items-center gap-1.5" data-testid="ai-generating-status">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Sedang Mengetik...
                      </span>
                    )}
                    {!aiGenerating && aiOutput && (
                      <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Strategi Siap!
                      </span>
                    )}
                  </div>

                  {aiOutput ? (
                    <div 
                      className="text-slate-200 text-sm leading-relaxed whitespace-pre-line space-y-4 overflow-y-auto max-h-[320px] font-sans pr-2"
                      data-testid="ai-strategy-output"
                    >
                      {aiOutput}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-500 space-y-2">
                      <Sparkles className="w-10 h-10 mx-auto text-slate-700 animate-pulse" />
                      <p className="font-bold text-sm">Belum Ada Strategi yang Dibuat</p>
                      <p className="text-xs max-w-xs mx-auto text-slate-600">Isi formulir di sebelah kiri untuk menghasilkan taktik pemasaran 3-langkah kustom langsung menggunakan AI.</p>
                    </div>
                  )}
                </div>

                {aiOutput && !aiGenerating && (
                  <div className="border-t border-white/10 pt-4 mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 relative z-10">
                    <div className="text-xs text-slate-400">
                      Sukai rencana ini? Ambil langkah nyata!
                    </div>
                    <button
                      onClick={() => {
                        setLeadForm((prev) => ({
                          ...prev,
                          business_desc: `Kategori: ${aiForm.business_category}. Ingin eksekusi rencana strategi AI untuk ${aiForm.business_name}`
                        }));
                        setShowLeadModal(true);
                      }}
                      className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1 transition-all duration-300"
                      data-testid="ai-claim-strategy-btn"
                    >
                      <span>Eksekusi Bersama Ahli</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FEATURED BENEFITS */}
      <section id="benefits" className="py-16 px-6 md:px-12 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-3 mb-12">
            <span className="text-orange-600 text-xs font-bold uppercase tracking-widest">Keunggulan Layanan</span>
            <h2 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">Mengapa Memilih Digitalindo?</h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">Kami tidak menggunakan strategi teoritis besar-besaran, melainkan taktik praktis yang langsung menghasilkan uang untuk UMKM.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-slate-200 rounded-2xl p-6 space-y-4 hover:border-orange-500 transition-colors duration-300">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-[#EA580C]">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-extrabold text-slate-900 text-lg">Pemasaran Lokal Tepat Sasaran</h3>
              <p className="text-slate-500 text-sm">Menjangkau target pelanggan di sekitar lokasi toko fisik atau area operasi layanan Anda menggunakan penargetan geografi yang spesifik.</p>
            </div>
            
            <div className="border border-slate-200 rounded-2xl p-6 space-y-4 hover:border-orange-500 transition-colors duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-extrabold text-slate-900 text-lg">Biaya yang Dapat Disesuaikan</h3>
              <p className="text-slate-500 text-sm">Iklan hemat mulai dari Rp 15.000 - Rp 50.000 per hari. Cocok untuk menguji pasar tanpa menguras anggaran kas bisnis.</p>
            </div>

            <div className="border border-slate-200 rounded-2xl p-6 space-y-4 hover:border-orange-500 transition-colors duration-300">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-extrabold text-slate-900 text-lg">Dipantau Lewat Handphone</h3>
              <p className="text-slate-500 text-sm">Laporan performa penjualan dan kampanye harian yang dikirim langsung ke WhatsApp Anda, ringkas dan bebas pusing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* RIWAYAT UMKM / HISTORY GENERATOR */}
      <section id="history" className="py-16 px-6 md:px-12 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <span className="text-orange-600 text-xs font-bold uppercase tracking-widest">Inspirasi Nyata</span>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Ide Digital Pemasaran UMKM Lain</h2>
            <p className="text-slate-500 text-xs sm:text-sm">Klik pada riwayat pencarian strategi AI di bawah ini untuk melihat contoh taktik promosi kustom.</p>
          </div>

          {briefHistory && briefHistory.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {briefHistory.map((brief, index) => (
                <div 
                  key={brief.id || index}
                  onClick={() => handleSelectHistoryBrief(brief)}
                  className={`bg-white border p-5 rounded-2xl cursor-pointer hover:border-orange-500 hover:shadow-md transition-all duration-300 text-left flex flex-col justify-between ${
                    selectedBrief && selectedBrief.id === brief.id ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-slate-200'
                  }`}
                  data-testid={`ai-brief-history-item-${index}`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-heading font-extrabold text-slate-900 text-sm truncate max-w-[150px]">{brief.business_name}</h4>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded font-semibold truncate shrink-0">{brief.business_category}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{brief.brief_content}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(brief.timestamp).toLocaleDateString("id-ID")}</span>
                    </span>
                    <span className="text-orange-600 font-bold hover:underline">Lihat Detail →</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 max-w-sm mx-auto space-y-2">
              <Briefcase className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-bold text-sm text-slate-600">Belum ada riwayat strategi</p>
              <p className="text-xs">Jadilah yang pertama merancang taktik menggunakan formulir di atas!</p>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white py-12 px-6 md:px-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">D</div>
              <span className="font-heading text-lg font-bold tracking-tight text-white">Digitalindo</span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm max-w-sm">Membawa UMKM Indonesia melangkah maju, mandiri secara finansial, dan merajai penjualan pasar digital nasional.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-orange-500">Menu Utama</h4>
            <ul className="text-slate-400 text-xs space-y-1">
              <li><a href="#calculator" className="hover:text-white">Kalkulator Potensi</a></li>
              <li><a href="#ai-generator" className="hover:text-white">Asisten AI</a></li>
              <li><a href="#benefits" className="hover:text-white">Keunggulan</a></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-orange-500">Hubungi Kami</h4>
            <ul className="text-slate-400 text-xs space-y-1">
              <li>info@digitalindo.co.id</li>
              <li>Jakarta, Indonesia</li>
              <li>+62 812-3456-789</li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-slate-800 text-center text-slate-500 text-xs flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 Digitalindo. Hak Cipta Dilindungi Undang-Undang.</p>
          <a href="https://emergent.sh" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400">Powered by emergent.sh</a>
        </div>
      </footer>

      {/* CONSULTATION FREE LEADS POPUP MODAL */}
      {showLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" data-testid="consultation-modal">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white p-6 relative">
              <button 
                onClick={() => {
                  setShowLeadModal(false);
                  setLeadSuccess(false);
                  setLeadError("");
                }}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                data-testid="consultation-close-button"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="space-y-1.5 pr-8">
                <div className="text-[10px] uppercase font-bold tracking-widest text-orange-500">Khusus Business Owner</div>
                <h3 className="font-heading font-extrabold text-xl sm:text-2xl">Klaim Sesi Konsultasi Gratis</h3>
                <p className="text-slate-300 text-xs sm:text-sm">Analisis peluang digital khusus bisnis Anda senilai Rp 1.500.000 — 100% Gratis!</p>
              </div>
            </div>

            {/* Modal Body / Form */}
            <div className="p-6 overflow-y-auto space-y-4">
              {leadSuccess ? (
                <div className="text-center py-6 space-y-4" data-testid="consultation-success-message">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-heading font-extrabold text-slate-900 text-lg sm:text-xl">Konsultasi Anda Terjadwal!</h4>
                    <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">
                      Terima kasih telah mendaftar. Tim Digital Marketing Ahli kami akan menghubungi Anda melalui No. WhatsApp dalam waktu maksimal 1x24 jam untuk menentukan jadwal pertemuan online.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowLeadModal(false);
                      setLeadSuccess(false);
                    }}
                    className="bg-slate-900 text-white hover:bg-orange-600 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
                  >
                    Tutup Jendela
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  {leadError && (
                    <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-semibold" data-testid="consultation-error-message">
                      {leadError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nama Lengkap Anda</label>
                    <input 
                      type="text"
                      name="name"
                      value={leadForm.name}
                      onChange={handleInputChange}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      data-testid="consultation-name-input"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nama Bisnis / UMKM</label>
                    <input 
                      type="text"
                      name="business_name"
                      value={leadForm.business_name}
                      onChange={handleInputChange}
                      placeholder="Contoh: CV Sejahtera Bersama"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      data-testid="consultation-business-name-input"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Alamat Email (Opsional)</label>
                    <input 
                      type="email"
                      name="email"
                      value={leadForm.email}
                      onChange={handleInputChange}
                      placeholder="Contoh: budi@gmail.com"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      data-testid="consultation-email-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">No. WhatsApp Aktif</label>
                    <input 
                      type="tel"
                      name="phone"
                      value={leadForm.phone}
                      onChange={handleInputChange}
                      placeholder="Contoh: 08123456789"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      data-testid="consultation-phone-input"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ceritakan Tantangan Bisnis Anda</label>
                    <textarea 
                      name="business_desc"
                      value={leadForm.business_desc}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Contoh: Kurang pelanggan baru, ingin belajar pasang iklan Facebook..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      data-testid="consultation-business-desc-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={leadSubmitting}
                    className="w-full bg-[#EA580C] hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 active:scale-95 mt-2"
                    data-testid="consultation-submit-button"
                  >
                    {leadSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sedang Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Kirim & Jadwalkan Sekarang</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating State-Based Toast System */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl p-4 shadow-2xl border transition-all duration-500 flex items-start gap-3 bg-white border-slate-200">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
          }`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-slate-900 text-sm">Notifikasi</h5>
            <p className="text-slate-500 text-xs leading-relaxed">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
