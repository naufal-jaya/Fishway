import Container from "@/components/Container";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { formatPrice } from "@/lib/data";
import { LogOut, Package, Truck, Check, ClipboardList, MapPin, User, Clock } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const STATUS_COLOR: Record<string, string> = {
  "Menunggu Konfirmasi": "bg-gray-100 text-gray-700",
  "Diproses": "bg-yellow-100 text-yellow-700",
  "Dikirim": "bg-blue-100 text-blue-700",
  "Selesai": "bg-green-100 text-green-700",
};

type Address = {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  is_primary: boolean;
};

export default async function ProfilePage() {
  const supabase = createClient(cookies()); 
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div>
        <Navbar />
        <Container>
          <div className="card p-12 text-center mt-8">
            <p className="text-gray-500">Silakan login untuk melihat profil.</p>
            <Link href="/login" className="btn-primary inline-block mt-4">Login</Link>
          </div>
        </Container>
      </div>
    );
  }

  // Fetch account data
  const { data: account } = await supabase
    .from("accounts")
    .select("name, address, created_at")
    .eq("id", user.id)
    .maybeSingle();

  // Fetch buyer data
  const { data: buyer } = await supabase
    .from("buyers")
    .select("phone")
    .eq("id", user.id)
    .maybeSingle();

  // Cek apakah user adalah penjual & ambil alamat toko
  const { data: store } = await supabase
    .from("stores")
    .select("id, name, address")
    .eq("seller_id", user.id)
    .maybeSingle();

  const isSeller = !!store;

const { data: addressesData } = !isSeller ? await supabase
  .from("addresses")
  .select("*")
  .eq("user_id", user.id)
  .order("is_primary", { ascending: false })
  .order("created_at", { ascending: false }) : { data: null };

const addresses = (addressesData || []) as Address[];

  // Fetch orders for summary
  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, total_amount, created_at, stores(name)")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  const menungguOrders = orders?.filter(o => o.status === "Menunggu Konfirmasi").length || 0;
  const diprosesOrders = orders?.filter(o => o.status === "Diproses").length || 0;
  const dikirimOrders = orders?.filter(o => o.status === "Dikirim").length || 0;
  const selesaiOrders = orders?.filter(o => o.status === "Selesai").length || 0;
  
  const recentOrders = orders?.slice(0, 3) || [];

  const joinDate = account?.created_at ? new Date(account.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : "-";

  return (
    <div>
      <Navbar />
      <Container>
        <div className="max-w-3xl mx-auto space-y-6 py-8">
          {/* Profile Card */}
          <div className="card p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={40} className="text-primary" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-800">
                  {account?.name || user.email?.split("@")[0] || "Pengguna"}
                </h1>
                <p className="text-gray-500 text-sm">{user.email}</p>
                <p className="text-gray-500 text-sm">{buyer?.phone || "Belum ada nomor HP"}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Bergabung sejak {joinDate}
                </p>
              </div>
              <Link href="/profile/edit" className="btn-outline text-sm py-1.5 px-4 mt-4 md:mt-0 whitespace-nowrap">
                Edit Profil
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Menunggu",
                value: menungguOrders,
                icon: <Clock size={28} className="text-orange-400 mx-auto" />,
                href: "/orders?status=Menunggu%20Konfirmasi",
              },
              {
                label: "Diproses",
                value: diprosesOrders,
                icon: <Package size={28} className="text-blue-500 mx-auto" />,
                href: "/orders?status=Diproses",
              },
              {
                label: "Dikirim",
                value: dikirimOrders,
                icon: <Truck size={28} className="text-indigo-500 mx-auto" />,
                href: "/orders?status=Dikirim",
              },
              {
                label: "Selesai",
                value: selesaiOrders,
                icon: <Check size={28} className="text-green-500 mx-auto" />,
                href: "/orders?status=Selesai",
              },
            ].map((stat) => (
              <Link key={stat.label} href={stat.href} className="card p-4 text-center hover:shadow-md transition-shadow">
                <p className="text-2xl mb-1">{stat.icon}</p>
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </Link>
            ))}
          </div>

          {/* Address — beda tampilan seller vs buyer */}
          <div className="card p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <MapPin size={20} className="text-primary" />
                {isSeller ? "Alamat Toko" : "Alamat Utama"}
              </h2>
              <Link
                href="/profile/edit"
                className="text-xs text-primary hover:underline"
              >
                Edit
              </Link>
            </div>

            {isSeller ? (
              store?.address ? (
                <p className="text-sm text-gray-700">{store.address}</p>
              ) : (
                <p className="text-sm text-gray-500">
                  Belum ada alamat toko.{" "}
                  <Link href="/profile/edit" className="text-primary hover:underline">
                    Isi sekarang
                  </Link>
                </p>
              )
            ) : (
              addresses.find(a => a.is_primary) ? (
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-medium">{addresses.find(a => a.is_primary)?.recipient_name} · {addresses.find(a => a.is_primary)?.phone}</p>
                  <p className="text-gray-500">{addresses.find(a => a.is_primary)?.address}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Belum ada alamat utama. <Link href="/profile/edit" className="text-primary hover:underline">Tambah sekarang</Link></p>
              )
            )}
          </div>

          {/* Order History */}
          <div className="card p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <ClipboardList size={20} className="text-primary" />
                Pesanan Terakhir
              </h2>
              <Link href="/orders" className="text-sm text-primary hover:underline">
                Lihat Semua
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Belum ada pesanan.</p>
              ) : (
                recentOrders.map((order) => {
                  const oDate = new Date(order.created_at).toLocaleDateString('id-ID');
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          {(Array.isArray(order.stores) ? order.stores[0]?.name : (order.stores as any)?.name) || "Toko"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {order.id.split("-")[0]} · {oDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-800 text-sm mb-1">
                          {formatPrice(order.total_amount)}
                        </p>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[order.status] || "bg-gray-100 text-gray-700"}`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div> 
          </div>

          {/* Quick Links */}
          <div className="pt-8 flex justify-center">
            <LogoutButton />
          </div>

        </div>
      </Container>
    </div>
  );
}