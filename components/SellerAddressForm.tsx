"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/supabaseClient";
import { MapPin, Pencil, Check, X, AlertCircle } from "lucide-react";

export default function SellerAddressForm() {
  const supabase = createClient();

  const [storeId, setStoreId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [address, setAddress] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStoreAddress() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: store } = await supabase
        .from("stores")
        .select("id, address")
        .eq("seller_id", user.id)
        .maybeSingle();

      if (store) {
        setStoreId(store.id);
        setAddress(store.address || "");
        setDraft(store.address || "");
      }
      setFetching(false);
    }
    fetchStoreAddress();
  }, []);

  const handleSave = async () => {
    if (!draft.trim()) {
      setError("Alamat toko tidak boleh kosong.");
      return;
    }
    if (!storeId) return;
    setError("");
    setLoading(true);

    const { error: dbError } = await supabase
      .from("stores")
      .update({ address: draft.trim() })
      .eq("id", storeId);

    if (dbError) {
      setError("Gagal menyimpan: " + dbError.message);
    } else {
      setAddress(draft.trim());
      setEditing(false);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setDraft(address);
    setError("");
    setEditing(false);
  };

  if (fetching) return null;
  if (!storeId) return null;

  return (
    <div className="card p-5 space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-3">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <MapPin size={18} className="text-primary" />
          Alamat Toko
          <span className="text-red-500 text-xs font-normal">*wajib</span>
        </h2>
        {!editing && (
          <button
            onClick={() => { setDraft(address); setEditing(true); }}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Pencil size={14} /> Edit
          </button>
        )}
      </div>

      {/* Warning jika alamat kosong */}
      {!address && !editing && (
        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>
            Alamat toko belum diisi. Pembeli tidak bisa mengetahui jarak ke toko Anda.
            <button
              onClick={() => { setDraft(""); setEditing(true); }}
              className="ml-1 underline font-medium"
            >
              Isi sekarang
            </button>
          </span>
        </div>
      )}

      {/* Tampilan alamat */}
      {!editing && address && (
        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200 leading-relaxed">
          {address}
        </p>
      )}

      {/* Form edit */}
      {editing && (
        <div className="space-y-2">
          <textarea
            rows={3}
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setError(""); }}
            placeholder="Masukkan alamat lengkap toko, misal: Jl. Raya No. 1, Kec. ABC, Kota XYZ"
            className={`w-full border rounded-lg p-2 text-sm outline-none focus:border-primary resize-none ${
              error ? "border-red-400" : "border-gray-300"
            }`}
            autoFocus
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <p className="text-xs text-gray-400">
            Alamat ini digunakan untuk menghitung jarak pengiriman ke pembeli.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 btn-outline py-2 rounded-xl text-sm flex items-center justify-center gap-1"
            >
              <X size={14} /> Batal
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 btn-primary py-2 rounded-xl text-sm flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <Check size={14} />
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
