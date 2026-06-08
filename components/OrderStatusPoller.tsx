"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
  orderId: string;
  /** Interval polling dalam ms, default 5000 (5 detik) */
  intervalMs?: number;
  /** Berapa kali maksimal polling, default 24 (2 menit total) */
  maxAttempts?: number;
};

/**
 * Komponen ini melakukan polling status pesanan di background.
 * Jika status sudah berubah dari "Menunggu Pembayaran", halaman di-refresh otomatis.
 * Hanya aktif ketika status masih "Menunggu Pembayaran".
 */
export default function OrderStatusPoller({ orderId, intervalMs = 5000, maxAttempts = 24 }: Props) {
  const router = useRouter();
  const attempts = useRef(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      attempts.current += 1;

      if (attempts.current > maxAttempts) {
        clearInterval(interval);
        return;
      }

      try {
        let midtransId = "";
        try {
          const savedIds = JSON.parse(localStorage.getItem("midtrans_tx_ids") || "{}");
          midtransId = savedIds[orderId] || "";
        } catch (e) {
          console.error("Gagal membaca transaction_id dari localStorage:", e);
        }

        const url = midtransId
          ? `/api/order-status/${orderId}?midtrans_id=${midtransId}`
          : `/api/order-status/${orderId}`;

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status && data.status !== "Menunggu Pembayaran") {
          clearInterval(interval);
          window.location.reload();
        }
      } catch {
        // Abaikan error jaringan, coba lagi nanti
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [orderId, intervalMs, maxAttempts, router]);

  return null; // Tidak render apapun
}
