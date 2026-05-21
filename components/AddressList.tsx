"use client";

import { useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Star } from "lucide-react";
import AddressForm from "./AddressForm";
import { deleteAddress, setPrimaryAddress } from "@/lib/addresses";

type Address = {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  is_primary: boolean;
};

export default function AddressList({ initialAddresses }: { initialAddresses: Address[] }) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [showForm, setShowForm] = useState(false);
  const [editAddress, setEditAddress] = useState<Address | undefined>();

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus alamat ini?")) return;
    await deleteAddress(id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSetPrimary = async (id: string) => {
    await setPrimaryAddress(id);
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, is_primary: a.id === id }))
    );
  };

  const handleClose = () => {
    setShowForm(false);
    setEditAddress(undefined);
    window.location.reload();
  };

  return (
    <div className="card p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <MapPin size={20} className="text-primary" />
          Alamat Saya
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Plus size={16} /> Tambah
        </button>
      </div>

      {addresses.length === 0 ? (
        <p className="text-sm text-gray-500">Belum ada alamat. Tambahkan alamat pengiriman kamu.</p>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className={`border rounded-xl p-4 ${addr.is_primary ? "border-primary bg-primary/5" : "border-gray-200"}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-gray-800">{addr.label}</span>
                    {addr.is_primary && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-white font-medium">Utama</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{addr.recipient_name} · {addr.phone}</p>
                  <p className="text-sm text-gray-500 mt-1">{addr.address}</p>
                </div>
                <div className="flex gap-2 ml-3">
                  {!addr.is_primary && (
                    <button onClick={() => handleSetPrimary(addr.id)} title="Jadikan utama">
                      <Star size={16} className="text-gray-400 hover:text-yellow-500" />
                    </button>
                  )}
                  <button onClick={() => { setEditAddress(addr); setShowForm(true); }}>
                    <Pencil size={16} className="text-gray-400 hover:text-primary" />
                  </button>
                  <button onClick={() => handleDelete(addr.id)}>
                    <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AddressForm existing={editAddress} onClose={handleClose} />
      )}
    </div>
  );
}