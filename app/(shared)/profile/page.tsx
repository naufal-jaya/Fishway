import Container from "@/components/Container";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { formatPrice } from "@/lib/data";
import { LogOut, Package, Truck, Check, ClipboardList, MapPin } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const STATUS_COLOR: Record<string, string> = {
  "Menunggu Konfirmasi": "bg-gray-100 text-gray-700",
  "Diproses": "bg-yellow-100 text-yellow-700",
  "Dikirim": "bg-blue-100 text-blue-700",
  "Selesai": "bg-green-100 text-green-700",
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

  // Fetch orders for summary
  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, total_amount, created_at, stores(name)")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  const totalOrders = orders?.length || 0;
  const completedOrders = orders?.filter(o => o.status === "Selesai").length || 0;
  const processingOrders = orders?.filter(o => o.status === "Diproses" || o.status === "Menunggu Konfirmasi").length || 0;
  
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
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center text-4xl flex-shrink-0">
                🧑‍💼
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
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Dikemas",
                value: totalOrders,
                icon: <Package size={36} className="text-blue-500 mx-auto" />,
              },

              { label: "Diantar",
                value: processingOrders,
                icon: <Truck size={36} className="text-yellow-500 mx-auto" />,
              },

              { 
                label: "Selesai",
                value: completedOrders,
                icon: <Check size={36} className="text-green-500 mx-auto" />,
              },
            ].map((stat) => (
              <div key={stat.label} className="card p-4 text-center">
                <p className="text-2xl mb-1">{stat.icon}</p>
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Address */}
          <div className="card p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <MapPin size={20} className="text-primary" />
                Alamat Utama
              </h2>
            </div>
            <p className="text-sm text-gray-600">
              {account?.address || "Belum ada alamat. Silakan edit profil untuk menambahkan alamat."}
            </p>
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