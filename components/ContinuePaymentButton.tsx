"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard } from "lucide-react";

declare global {
  interface Window {
    snap: any;
  }
}

type Props = {
  orderId: string;
  totalAmount: number;
  customerName?: string;
  customerPhone?: string;
};

export default function ContinuePaymentButton({
  orderId,
  totalAmount,
  customerName,
  customerPhone,
}: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Load Midtrans Snap script
  useEffect(() => {
    const snapScript = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
    if (!document.querySelector(`script[src="${snapScript}"]`)) {
      const script = document.createElement("script");
      script.src = snapScript;
      script.setAttribute("data-client-key", clientKey);
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleContinuePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: [orderId],
          totalAmount,
          customerDetails: {
            first_name: customerName || "Pembeli",
            phone: customerPhone || "",
          },
        }),
      });

      const paymentData = await response.json();

      if (!response.ok || !paymentData.token) {
        throw new Error(paymentData.error || "Gagal mendapatkan token pembayaran");
      }

      // Simpan transaction_id ke localStorage agar poller bisa cek statusnya langsung ke Midtrans
      if (paymentData.transaction_id) {
        try {
          const savedIds = JSON.parse(localStorage.getItem("midtrans_tx_ids") || "{}");
          savedIds[orderId] = paymentData.transaction_id;
          localStorage.setItem("midtrans_tx_ids", JSON.stringify(savedIds));
        } catch (e) {
          console.error("Gagal menyimpan transaction_id ke localStorage:", e);
        }
      }

      window.snap.pay(paymentData.token, {
        onSuccess: function () {
          // Force full reload agar status terbaru langsung tampil
          window.location.reload();
        },
        onPending: function () {
          // Tetap di halaman, poller akan otomatis refresh saat status berubah
          window.location.reload();
        },
        onError: function () {
          setLoading(false);
          alert("Pembayaran gagal. Silakan coba lagi.");
        },
        onClose: function () {
          setLoading(false);
        },
      });
    } catch (error: any) {
      alert(error.message || "Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleContinuePayment}
      disabled={loading}
      className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors disabled:opacity-60 whitespace-nowrap"
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Memproses...
        </>
      ) : (
        <>
          <CreditCard size={16} />
          Lanjutkan Pembayaran
        </>
      )}
    </button>
  );
}
