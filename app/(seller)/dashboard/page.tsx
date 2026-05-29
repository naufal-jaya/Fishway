import Container from "@/components/Container";
import { formatPrice } from "@/lib/data";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function SellerDashboardPage() {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Get Store
  const { data: store } = await supabase
    .from("stores")
    .select("id, name, phone")
    .eq("seller_id", user.id)
    .maybeSingle();

  if (!store) {
    return (
      <div>
        <Navbar />
        <Container>
          <div className="card p-12 text-center mt-8">
            <h2 className="text-xl font-bold mb-4">Anda belum memiliki toko.</h2>
            <p className="text-gray-500 mb-6">Silakan buat toko terlebih dahulu untuk mulai berjualan.</p>
            {/* TODO: Add create store button */}
          </div>
        </Container>
      </div>
    );
  }

  // Get Products Count
  const { count: productsCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id);

  // Get Orders
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id, status, total_amount, shipping_cost, created_at,
      buyers ( accounts ( name ) ),
      order_items ( products ( name ) )
    `)
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  const totalOrders = orders?.length || 0;
  const pendingOrders = orders?.filter(o => o.status === "Menunggu Konfirmasi" || o.status === "Diproses").length || 0;
  const totalRevenue = orders?.filter(o => o.status === "Selesai").reduce((sum, o) => sum + o.total_amount, 0) || 0;

  const recentOrders = orders?.slice(0, 3) || [];

  return (
    <div>
      <Navbar />
      <Container>
        <div className="max-w-4xl mx-auto py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Dashboard Penjual
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Toko: <span className="font-semibold text-gray-700">{store.name}</span> | 📞 {store.phone || "Tidak ada nomor telp"}
              </p>
            </div>
            <Link href="/dashboard/products/add" className="btn-primary text-sm whitespace-nowrap">
              + Tambah Produk
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total Produk",
                value: productsCount || 0,
                icon: "📦",
                color: "bg-blue-50 text-blue-600",
              },
              {
                label: "Pesanan Masuk",
                value: totalOrders,
                icon: "🛍️",
                color: "bg-green-50 text-green-600",
              },
              {
                label: "Perlu Diproses",
                value: pendingOrders,
                icon: "⏳",
                color: "bg-yellow-50 text-yellow-600",
              },
              {
                label: "Total Pendapatan",
                value: formatPrice(totalRevenue),
                icon: "💰",
                color: "bg-purple-50 text-purple-600",
              },
            ].map((stat) => (
              <div key={stat.label} className="card p-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-2 ${stat.color}`}
                >
                  {stat.icon}
                </div>
                <p className="text-xl font-bold text-gray-800 leading-tight">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Menu Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Link
              href="/dashboard/products"
              className="card p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center text-3xl">
                  📦
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 group-hover:text-primary transition-colors">
                    Kelola Produk
                  </h3>
                  <p className="text-sm text-gray-500">
                    {productsCount || 0} produk aktif
                  </p>
                </div>
                <span className="text-gray-300 group-hover:text-primary transition-colors text-xl">
                  →
                </span>
              </div>
            </Link>
            <Link
              href="/dashboard/orders"
              className="card p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-green-100 w-14 h-14 rounded-xl flex items-center justify-center text-3xl">
                  🛍️
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 group-hover:text-primary transition-colors">
                    Kelola Pesanan
                  </h3>
                  <p className="text-sm text-gray-500">
                    {totalOrders} total pesanan
                  </p>
                </div>
                <span className="text-gray-300 group-hover:text-primary transition-colors text-xl">
                  →
                </span>
              </div>
            </Link>
          </div>

          {/* Recent Orders */}
          <div className="card p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800">Pesanan Terbaru</h2>
              <Link
                href="/dashboard/orders"
                className="text-sm text-primary hover:underline"
              >
                Lihat semua
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Belum ada pesanan terbaru.</p>
              ) : (
                recentOrders.map((order) => {
                  const oDate = new Date(order.created_at).toLocaleDateString('id-ID');
                  const buyerData = Array.isArray(order.buyers) ? order.buyers[0] : order.buyers;
                  const accountData = buyerData && Array.isArray((buyerData as any).accounts)
                    ? (buyerData as any).accounts[0]
                    : (buyerData as any)?.accounts;
                  const buyerName = accountData?.name || "Pembeli";

                  const productData = order.order_items?.[0];
                  const productInfo = productData && Array.isArray((productData as any).products)
                    ? (productData as any).products[0]
                    : (productData as any)?.products;
                  const productStr = productInfo?.name || "Produk";

                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between text-sm border-b pb-3 last:border-0 last:pb-0 hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{productStr} {order.order_items.length > 1 ? `(+${order.order_items.length - 1} lainnya)` : ""}</p>
                        <p className="text-xs text-gray-400">
                          {buyerName} · {oDate}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="font-bold text-gray-800">
                          {formatPrice(order.total_amount + order.shipping_cost)}
                        </p>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${order.status === "Selesai"
                              ? "bg-green-100 text-green-700"
                              : order.status === "Dikirim"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
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
        </div>
      </Container>
    </div>
  );
}
