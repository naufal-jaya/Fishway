"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Container from "@/components/Container";
import { createClient } from "@/utils/supabase/supabaseClient";
import AddressList from "@/components/AddressList";
import { getAddresses } from "@/lib/addresses";

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
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const [{ data: account }, { data: buyer }] = await Promise.all([
        supabase.from("accounts").select("name, address").eq("id", user.id).maybeSingle(),
        supabase.from("buyers").select("phone").eq("id", user.id).maybeSingle(),
      ]);

      const fetchedAddresses = await getAddresses();
      setAddresses(fetchedAddresses || []);

      setFormData({
        name: account?.name || user.email?.split("@")[0] || "",
        phone: buyer?.phone || "",
        address: account?.address || "",
      });
      setFetching(false);
    }
    fetchProfile();
  }, [supabase, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!userId) throw new Error("Not authenticated");

      // Update accounts
      await supabase.from("accounts").update({
        name: formData.name,
        address: formData.address,
      }).eq("id", userId);

      // Upsert buyers (since phone is in buyers table, and might not exist yet)
      const { data: buyerExists } = await supabase.from("buyers").select("id").eq("id", userId).maybeSingle();
      if (buyerExists) {
        await supabase.from("buyers").update({ phone: formData.phone }).eq("id", userId);
      } else {
        await supabase.from("buyers").insert({ id: userId, phone: formData.phone });
      }

      // Sync phone number to stores table if user is a seller
      const { data: storeExists } = await supabase.from("stores").select("id").eq("seller_id", userId).maybeSingle();
      if (storeExists) {
        await supabase.from("stores").update({ phone: formData.phone }).eq("seller_id", userId);
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

            {/* KIRI — Form Edit Profil (tanpa tombol) */}
            <form onSubmit={handleSubmit} className="card p-6 space-y-4">
              <h2 className="font-bold text-gray-800 text-lg border-b pb-3">👤 Informasi Akun</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full border rounded-lg p-2" placeholder="08..." />
              </div>
            </form>

            {/* KANAN — Alamat Saya + tombol di bawahnya */}
            <div className="space-y-4">
              <AddressList initialAddresses={addresses} />

              {/* Tombol di bawah card kanan */}
              <div className="flex gap-3">
                <button type="button" onClick={() => router.push("/profile")} className="flex-1 btn-outline py-2.5 rounded-xl">
                  Batal
                </button>
                <button disabled={loading} onClick={handleSubmit} className="flex-1 btn-primary py-2.5 rounded-xl">
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