"use client";

import { useState } from "react";
import { XCircle, MessageCircle } from "lucide-react";

export default function CancelOrderButton({ 
  action, 
  buyerPhone, 
  orderId 
}: { 
  action: (formData: FormData) => Promise<void>;
  buyerPhone?: string;
  orderId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reasonType, setReasonType] = useState("Ikan mati di perjalanan");
  const [customReason, setCustomReason] = useState("");

  const finalReason = reasonType === "Lainnya" ? customReason : reasonType;

  // Generate WA link
  const waLink = buyerPhone && buyerPhone !== "Tidak ada nomor" 
    ? `https://wa.me/${buyerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo, pesanan anda dengan ID ${orderId} terpaksa kami batalkan karena ${finalReason}. Mohon persetujuan pembatalannya di halaman pesanan Anda ya.`)}`
    : "#";

  return (
    <div className="mt-6 pt-6 border-t border-red-100">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-red-500 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors"
        >
          <XCircle className="w-4 h-4" />
          Batalkan Pesanan
        </button>
      ) : (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <h3 className="text-sm font-bold text-red-700 mb-1">Ajukan Pembatalan Pesanan</h3>
          <p className="text-xs text-red-500 mb-4">Pesanan akan dibatalkan setelah pembeli menyetujui refund via WhatsApp.</p>
          
          <form action={action} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-red-700 mb-1 block">Pilih Alasan</label>
              <select
                value={reasonType}
                onChange={(e) => setReasonType(e.target.value)}
                className="border border-red-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-red-400 bg-white text-gray-700"
              >
                <option value="Ikan mati di perjalanan">Ikan mati di perjalanan</option>
                <option value="Stok habis">Stok habis</option>
                <option value="Toko sedang tutup">Toko sedang tutup</option>
                <option value="Lainnya">Lainnya...</option>
              </select>
            </div>

            {reasonType === "Lainnya" && (
              <div>
                <label className="text-xs font-semibold text-red-700 mb-1 block">Alasan Spesifik</label>
                <input
                  type="text"
                  required
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Ketik alasan pembatalan..."
                  className="border border-red-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-red-400 bg-white"
                />
              </div>
            )}

            {/* Hidden input to send the final reason to the server action */}
            <input type="hidden" name="reason" value={finalReason} />

            <div className="mt-2 space-y-2">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors w-full"
              >
                <MessageCircle className="w-4 h-4" />
                Hubungi Pembeli (WhatsApp)
              </a>
              
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex-1"
                >
                  Ajukan Pembatalan
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-100 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}