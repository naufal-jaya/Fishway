"use client";

import { useState } from "react";
import { checkoutCart } from "@/lib/cart";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

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
  confirmOnly?: boolean;
};

export default function CheckoutClient({ addresses = [], defaultName, defaultPhone, confirmOnly }: Props) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const router = useRouter();

  const primaryAddress = addresses.find(a => a.is_primary) || addresses[0];
  const [selectedId, setSelectedId] = useState(primaryAddress?.id || "");
  const selectedAddress = addresses.find(a => a.id === selectedId);

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
      router.push("/orders");
      router.refresh();
    } catch (err) {
      alert("Terjadi kesalahan.");
      setLoading(false);
    }
  };

  // Mode tombol saja (di bawah QRIS)
  if (confirmOnly) {
    return (
      <div>
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
      </div>
    );
  }

  // Mode form detail pemesan (di kiri)
  return (
    <>
      {/* Nama */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemesan</label>
        <input
          type="text"
          defaultValue={defaultName}
          readOnly
          className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700"
        />
      </div>

      {/* No Telp */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
        <input
          type="text"
          defaultValue={defaultPhone}
          readOnly
          className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700"
        />
      </div>

      {/* Dropdown Alamat */}
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

        {/* Detail alamat dipilih */}
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

      {/* Catatan */}
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
  );
}