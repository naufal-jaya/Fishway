"use client";

import { useState } from "react";
import { clearCart } from "@/lib/cart";
import { useRouter } from "next/navigation";

export default function CheckoutClient() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const result = await clearCart();
      if (result.error) {
        alert(result.error);
        setLoading(false);
        return;
      }

      alert("Pembayaran Berhasil! Keranjang telah dikosongkan.");
      router.push("/");
      router.refresh();
    } catch (err) {
      alert("Terjadi kesalahan.");
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={handleConfirm}
        disabled={loading}
        className="btn-primary w-full py-3 rounded-xl text-base disabled:opacity-50"
      >
        {loading ? "Memproses..." : "✅ Sudah Scan, Konfirmasi Pembayaran"}
      </button>
      <p className="text-xs text-center text-gray-400 mt-2">
        Karena ini versi demo, konfirmasi akan langsung berhasil dan mengosongkan keranjang.
      </p>
    </>
  );
}
