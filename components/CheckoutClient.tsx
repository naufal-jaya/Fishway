"use client";

import { useState } from "react";
import { checkoutCart } from "@/lib/cart";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { formatPrice } from "@/lib/data";

type Address = {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  is_primary: boolean;
};

type Props = {
  addresses?: Address[];
  defaultName?: string;
  defaultPhone?: string;
  formattedItems: any[];
  shipping: number;
  biayaAdmin: number;
  total: number;
};

export default function CheckoutClient({ addresses = [], defaultName, defaultPhone, formattedItems, shipping, biayaAdmin, total }: Props) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const router = useRouter();

  const primaryAddress = addresses.find(a => a.is_primary) || addresses[0];
  const [selectedId, setSelectedId] = useState(primaryAddress?.id || "");
  const selectedAddress = addresses.find(a => a.id === selectedId);

  const handleConfirm = async () => {
    if (!selectedId && addresses.length > 0) {
      alert("Pilih alamat pengiriman terlebih dahulu.");
      return;
    }
    
    if (loading) return;
    setLoading(true);
    try {
      const result = await checkoutCart(selectedId, note);
      if (result.error) {
        alert(result.error);
        setLoading(false);
        return;
      }
      alert("Pesanan Berhasil Dibuat! Anda akan diarahkan ke halaman pesanan.");
      router.push("/orders");
      router.refresh();
    } catch (err) {
      alert("Terjadi kesalahan.");
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-start">
      {/* KIRI — Detail Pemesan */}
      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-gray-800 text-lg border-b pb-3">
          👤 Detail Pemesan
        </h2>

        {addresses.length === 0 ? (
          <p className="text-sm text-gray-500">
            Belum ada alamat tersimpan.{" "}
            <a href="/profile/edit" className="text-primary hover:underline">Tambah alamat</a>
          </p>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemesan</label>
              <input
                type="text"
                defaultValue={defaultName}
                readOnly
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
              <input
                type="text"
                defaultValue={defaultPhone}
                readOnly
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Pengiriman</label>
              <div className="relative">
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary appearance-none pr-8"
                >
                  {addresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.label} {addr.is_primary ? "(Utama)" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
              </div>

              {selectedAddress && (
                <div className="mt-2 border border-primary/30 rounded-xl p-4 bg-primary/5 space-y-1 text-sm">
                  <p className="font-semibold text-gray-800">
                    {selectedAddress.label}
                    {selectedAddress.is_primary && (
                      <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-primary text-white font-medium">Utama</span>
                    )}
                  </p>
                  <p className="font-medium text-gray-800">{selectedAddress.recipient_name}</p>
                  <p className="text-gray-500">{selectedAddress.phone}</p>
                  <p className="text-gray-500">{selectedAddress.address}</p>
                  <a href="/profile/edit" className="text-primary text-xs hover:underline inline-block pt-1">
                    + Ubah / Tambah Alamat
                  </a>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Misal: taruh di depan pintu"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </>
        )}
      </div>

      {/* KANAN — Pesanan + QRIS + Tombol Konfirmasi */}
      <div className="space-y-4">
        {/* Order Summary */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-800 mb-3 border-b pb-2">
            🧾 Pesanan
          </h2>
          <div className="space-y-2">
            {formattedItems.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.name} x{item.qty}</span>
                <span className="font-medium">{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm text-gray-500 pt-2">
              <span>Ongkos Kirim</span>
              <span>{formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Biaya Admin</span>
              <span>{formatPrice(biayaAdmin)}</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between font-bold text-primary text-base">
              <span>Total Bayar</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        {/* QRIS Payment */}
        <div className="card p-5 text-center">
          <h2 className="font-bold text-gray-800 mb-3">💳 Pembayaran QRIS</h2>
          <div className="bg-gray-100 rounded-xl w-40 h-40 mx-auto flex items-center justify-center mb-3 border-2 border-dashed border-gray-300">
            <span className="text-4xl">📱</span>
          </div>
          <p className="text-sm text-gray-500 mb-1">
            Scan QR Code dengan e-wallet atau mobile banking
          </p>
          <p className="font-bold text-primary text-lg">{formatPrice(total)}</p>
          <p className="text-xs text-gray-400 mt-1">Berlaku 15 menit</p>
        </div>

        {/* Tombol konfirmasi */}
        <div>
          <button
            onClick={handleConfirm}
            disabled={loading || addresses.length === 0}
            className="btn-primary w-full py-3 rounded-xl text-base disabled:opacity-50"
          >
            {loading ? "Memproses..." : "✅ Sudah Scan, Konfirmasi Pembayaran"}
          </button>
          <p className="text-xs text-center text-gray-400 mt-2">
            Karena ini versi demo, konfirmasi akan langsung berhasil dan mengosongkan keranjang.
          </p>
        </div>
      </div>
    </div>
  );
}