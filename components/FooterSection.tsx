"use client";

import { useState } from "react";
import { Phone, Mail, ChevronDown, ChevronUp } from "lucide-react";

export default function FooterSection() {
  const [isTataCaraOpen, setIsTataCaraOpen] = useState(false);
  const [isHubungiKamiOpen, setIsHubungiKamiOpen] = useState(false);

  const currentYear = new Date().getFullYear();

  return (
    <div className="relative z-30 max-w-4xl mx-auto px-4 w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-12 pb-32">
      {/* Card Tata Cara */}
      <div className="bg-[#407BB5] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col gap-4 md:gap-6">
        {/* Header - Button on Mobile, Div/Button on Desktop */}
        <button
          onClick={() => setIsTataCaraOpen(!isTataCaraOpen)}
          className="flex items-center justify-between w-full font-bold text-xl sm:text-2xl border-b border-white/20 pb-3 text-left focus:outline-none md:pointer-events-none md:cursor-default"
        >
          <span>Tata Cara Pemesanan</span>
          <span className="md:hidden">
            {isTataCaraOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </span>
        </button>

        {/* Collapsible Content */}
        <div className={`flex flex-col gap-3 transition-all duration-300 md:flex ${isTataCaraOpen ? "flex" : "hidden"}`}>
          {[
            "Pilih Produk",
            "Masukkan Keranjang",
            "Checkout Ikan",
            "Pengiriman",
            "Nikmati Ikan Segar!",
          ].map((step, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 bg-white text-[#407BB5] px-4 py-3 rounded-full font-bold shadow-md transform hover:scale-[1.02] transition-transform duration-200"
            >
              <span className="w-8 h-8 rounded-full bg-[#407BB5] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-inner">
                {idx + 1}
              </span>
              <span className="text-sm sm:text-base">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card Hubungi Kami */}
      <div className="bg-[#407BB5] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col gap-4 md:gap-6 justify-between">
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Header - Button on Mobile, Div/Button on Desktop */}
          <button
            onClick={() => setIsHubungiKamiOpen(!isHubungiKamiOpen)}
            className="flex items-center justify-between w-full font-bold text-xl sm:text-2xl border-b border-white/20 pb-3 text-left focus:outline-none md:pointer-events-none md:cursor-default"
          >
            <span>Hubungi Kami</span>
            <span className="md:hidden">
              {isHubungiKamiOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </span>
          </button>

          {/* Collapsible Content */}
          <div className={`flex flex-col gap-4 transition-all duration-300 md:flex ${isHubungiKamiOpen ? "flex" : "hidden"}`}>
            {/* Whatsapp Link */}
            <a
              href="https://wa.me/6281325659468"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 sm:gap-4 bg-white text-[#407BB5] px-4 py-3 sm:px-6 sm:py-4 rounded-full font-bold shadow-md hover:bg-blue-50 transition-colors transform hover:scale-[1.02] transition-transform duration-200"
            >
              <Phone className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-[#407BB5]" />
              <span className="text-xs sm:text-sm md:text-lg truncate">+62 813-2565-9468</span>
            </a>

            {/* Email Link */}
            <a
              href="mailto:Fishway@gmail.com"
              className="flex items-center gap-3 sm:gap-4 bg-white text-[#407BB5] px-4 py-3 sm:px-6 sm:py-4 rounded-full font-bold shadow-md hover:bg-blue-50 transition-colors transform hover:scale-[1.02] transition-transform duration-200"
            >
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-[#407BB5]" />
              <span className="text-xs sm:text-sm md:text-lg truncate">Fishway@gmail.com</span>
            </a>
          </div>
        </div>

        <div className="text-center text-xs text-white/60 mt-6">
          © {currentYear} Fishway. Hak Cipta Dilindungi.
        </div>
      </div>
    </div>
  );
}
