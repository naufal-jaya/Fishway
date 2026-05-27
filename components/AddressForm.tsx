"use client";

import { useState } from "react";
import { addAddress, updateAddress } from "@/lib/addresses";

type Address = {
  id?: string;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  is_primary: boolean;
};

export default function AddressForm({
  existing,
  onClose,
}: {
  existing?: Address;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Address>(
    existing || { label: "", recipient_name: "", phone: "", address: "", is_primary: false }
  );
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<{ phone?: string; recipient_name?: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { phone?: string; recipient_name?: string } = {};

    if (!form.recipient_name.trim()) {
      newErrors.recipient_name = "Nama penerima tidak boleh kosong.";
    } else if (/\d/.test(form.recipient_name)) {
      newErrors.recipient_name = "Nama tidak boleh mengandung angka.";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Nomor telepon tidak boleh kosong.";
    } else if (!/^(\+62|62|0)[0-9]{8,12}$/.test(form.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Nomor tidak valid. Contoh: 08123456789";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    if (existing?.id) {
      await updateAddress(existing.id, form);
    } else {
      await addAddress(form);
    }
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <h2 className="font-bold text-gray-800 text-lg">{existing ? "Edit Alamat" : "Tambah Alamat"}</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Label (contoh: Rumah, Kantor)</label>
            <input required name="label" value={form.label} onChange={handleChange} className="w-full border rounded-lg p-2 mt-1 text-sm" placeholder="Rumah" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Nama Penerima</label>
            <input
              required
              name="recipient_name"
              value={form.recipient_name}
              onChange={(e) => {
                handleChange(e);
                setErrors((prev) => ({ ...prev, recipient_name: undefined }));
              }}
              className={`w-full border rounded-lg p-2 mt-1 text-sm ${errors.recipient_name ? "border-red-400" : ""}`}
            />
            {errors.recipient_name && <p className="text-xs text-red-500 mt-1">{errors.recipient_name}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Nomor Telepon</label>
            <input
              required
              name="phone"
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9+]/g, "");
                setForm({ ...form, phone: val });
                setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              className={`w-full border rounded-lg p-2 mt-1 text-sm ${errors.phone ? "border-red-400" : ""}`}
              placeholder="08123456789"
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Alamat Lengkap</label>
            <textarea required name="address" value={form.address} onChange={handleChange} rows={3} className="w-full border rounded-lg p-2 mt-1 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_primary" checked={form.is_primary} onChange={(e) => setForm({ ...form, is_primary: e.target.checked })} />
            <label htmlFor="is_primary" className="text-sm text-gray-700">Jadikan alamat utama</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline py-2 rounded-xl text-sm">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary py-2 rounded-xl text-sm">
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}