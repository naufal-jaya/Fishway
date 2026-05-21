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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
            <input required name="recipient_name" value={form.recipient_name} onChange={handleChange} className="w-full border rounded-lg p-2 mt-1 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Nomor Telepon</label>
            <input required name="phone" value={form.phone} onChange={handleChange} className="w-full border rounded-lg p-2 mt-1 text-sm" placeholder="08..." />
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