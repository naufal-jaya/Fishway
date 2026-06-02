"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function AcceptCancelButton({ action }: { action: (formData: FormData) => Promise<void> | void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center w-full sm:w-auto transition-colors"
      >
        Terima Pembatalan
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Konfirmasi</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin sudah menerima refund dan menyetujui pembatalan pesanan ini? Tindakan ini tidak dapat diubah kembali.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <form action={action} className="flex-1">
                <button
                  type="submit"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  Ya, Setujui
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
