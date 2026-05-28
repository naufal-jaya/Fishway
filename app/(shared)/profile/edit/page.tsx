"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Container from "@/components/Container";
import { createClient } from "@/utils/supabase/supabaseClient";
import AddressList from "@/components/AddressList";
import SellerAddressForm from "@/components/SellerAddressForm";
import { getAddresses } from "@/lib/addresses";
import { User } from "lucide-react";

type Address = {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  is_primary: boolean;
};

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [userId, setUserId] = useState("");
  const [isSeller, setIsSeller] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const [{ data: account }, { data: buyer }, { data: store }] = await Promise.all([
        supabase.from("accounts").select("name").eq("id", user.id).maybeSingle(),
        supabase.from("buyers").select("phone").eq("id", user.id).maybeSingle(),
        supabase.from("stores").select("id, name").eq("seller_id", user.id).maybeSingle(),
      ]);

      const sellerDetected = !!store;
      setIsSeller(sellerDetected);

      // Hanya fetch buyer addresses jika bukan penjual
      if (!sellerDetected) {
        const fetchedAddresses = await getAddresses();
        setAddresses(fetchedAddresses || []);
      }

      setFormData({
        name: sellerDetected ? (store?.name || account?.name || "") : (account?.name || user.email?.split("@")[0] || ""),
        phone: buyer?.phone || "",
      });
      setFetching(false);
    }
    fetchProfile();
  }, [supabase, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { name?: string; phone?: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama tidak boleh kosong.";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Nama minimal 2 karakter.";
    } else if (/\d/.test(formData.name)) {
      newErrors.name = "Nama tidak boleh mengandung angka.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Nomor telepon tidak boleh kosong.";
    } else if (!/^(\+62|62|0)[0-9]{8,12}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Nomor telepon tidak valid. Contoh: 08123456789";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      if (!userId) throw new Error("Not authenticated");

      // Update accounts
      await supabase.from("accounts").update({
        name: formData.name,
      }).eq("id", userId);

      // Upsert buyers
      const { data: buyerExists } = await supabase.from("buyers").select("id").eq("id", userId).maybeSingle();
      if (buyerExists) {
        await supabase.from("buyers").update({ phone: formData.phone }).eq("id", userId);
      } else {
        await supabase.from("buyers").insert({ id: userId, phone: formData.phone });
      }

      // Sync name & phone ke stores jika seller
      if (isSeller) {
        await supabase.from("stores").update({
          name: formData.name,
          phone: formData.phone,
        }).eq("seller_id", userId);
      }

      alert("Profil berhasil diperbarui!");
      router.push("/profile");
      router.refresh();

    } catch (error: any) {
      console.error(error);
      alert("Gagal memperbarui profil.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="text-center py-20">Memuat profil...</div>;
  }

  return (
    <div>
      <Navbar />
      <Container>
        <div className="max-w-4xl mx-auto py-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Profil</h1>

          <div className="grid md:grid-cols-2 gap-6 items-start">

            {/* KIRI — Informasi Akun */}
            <form onSubmit={handleSubmit} className="card p-6 space-y-4">
              <h2 className="font-bold text-gray-800 text-lg border-b pb-3 flex items-center gap-2">
                <User size={18} className="text-primary" /> Informasi Akun
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isSeller ? "Nama Toko" : "Nama Lengkap"}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => {
                    handleChange(e);
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={`w-full border rounded-lg p-2 ${errors.name ? "border-red-400 focus:outline-red-400" : ""}`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9+]/g, "");
                    setFormData({ ...formData, phone: val });
                    setErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  className={`w-full border rounded-lg p-2 ${errors.phone ? "border-red-400 focus:outline-red-400" : ""}`}
                  placeholder="08123456789"
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </form>

            {/* KANAN — Alamat (berbeda untuk seller dan buyer) */}
            <div className="space-y-4">
              {isSeller ? (
                /* Penjual: 1 alamat toko, wajib, self-managed */
                <SellerAddressForm />
              ) : (
                /* Pembeli: banyak alamat pengiriman */
                <AddressList initialAddresses={addresses} />
              )}

              {/* Tombol aksi */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/profile")}
                  className="flex-1 btn-outline py-2.5 rounded-xl"
                >
                  Batal
                </button>
                <button
                  disabled={loading}
                  onClick={handleSubmit}
                  className="flex-1 btn-primary py-2.5 rounded-xl"
                >
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>

          </div>
        </div>
      </Container>
    </div>
  );
}