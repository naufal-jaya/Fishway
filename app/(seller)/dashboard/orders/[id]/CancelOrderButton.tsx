"use client";

import { useState } from "react";
import { XCircle } from "lucide-react";

export default function CancelOrderButton({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);

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
          <h3 className="text-sm font-bold text-red-700 mb-1">Batalkan Pesanan</h3>
          <p className="text-xs text-red-400 mb-3">Tindakan ini tidak dapat dibatalkan.</p>
          <form action={action} className="flex flex-col gap-2">
            <input
              name="reason"
              type="text"
              placeholder="Alasan pembatalan (opsional)"
              className="border border-red-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-red-400 bg-white"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Konfirmasi Batalkan
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}