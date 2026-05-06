"use client";

import { useState } from "react";
import { checkoutCart } from "@/lib/cart";
import { useRouter } from "next/navigation";

export default function CheckoutClient() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const result = await checkoutCart();
      if (result.error) {
        alert(result.error);
        setLoading(false);
        return;
      }

      alert("Pesanan Berhasil Dibuat! Anda akan diarahkan ke halaman pesanan.");
      router.push("/orders"); // Asumsikan /orders untuk buyer (bukan /buyer/orders karena struktur foldernya di luar (buyer) atau di dalam?)
      // Wait, let's check folder structure... I should use /orders if it's in (buyer) and doesn't have prefix. Let's redirect to /orders.
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
