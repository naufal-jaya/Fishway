import Container from "@/components/Container";
import { formatPrice, parseSupabaseDate } from "@/lib/data";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Package, ShoppingBag, Clock, Wallet, Phone, Truck, Check, X, ChevronRight, Banknote } from "lucide-react";

import StatusBadge from "@/components/StatusBadge";

export default async function SellerDashboardPage() {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

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
          </div>
        </Container>
      </div>
    );
  }

  const [productsCountRes, ordersRes] = await Promise.all([
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id),
    supabase
      .from("orders")
      .select(`
        id, status, total_amount, shipping_cost, shipping_method, created_at, cancel_reason,
        buyers ( accounts ( name ) ),
        order_items ( id, quantity, price, products ( name ) )
      `)
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
  ]);

  const productsCount = productsCountRes.count;
  const orders = ordersRes.data;

  const totalOrders = orders?.length || 0;
  const pendingOrders = orders?.filter(o =>
    o.status === "Menunggu Konfirmasi" || o.status === "Diproses"
  ).length || 0;
  const totalRevenue = orders
    ?.filter(o => ["Diproses", "Dikirim", "Selesai", "Proses Pembatalan"].includes(o.status))
    .reduce((sum, o) => {
      let currentTotal = o.total_amount || 0;
      if (o.status === "Proses Pembatalan" && o.cancel_reason?.startsWith("JSON_DATA:")) {
        try {
          const deadItems = JSON.parse(o.cancel_reason.substring(10));
          let refundTotal = 0;
          o.order_items.forEach((item: any) => {
            const deadQty = deadItems[item.id];
            if (deadQty) {
              refundTotal += deadQty * (item.price || 0);
            }
          });
          currentTotal = Math.max(0, currentTotal - refundTotal);
        } catch (e) {
          console.error("Failed to parse cancel_reason JSON on dashboard:", e);
        }
      }
      const netAmount = Math.max(0, currentTotal - 5000);
      const shippingAdd = o.shipping_method === "penjual" ? (o.shipping_cost || 0) : 0;
      return sum + netAmount + shippingAdd;
    }, 0) || 0;

  const recentOrders = orders?.slice(0, 3) || [];

  const menungguBayarOrders = orders?.filter(o => o.status === "Menunggu Pembayaran").length || 0;
  const menungguOrders = orders?.filter(o => o.status === "Menunggu Konfirmasi").length || 0;
  const diprosesOrders = orders?.filter(o => o.status === "Diproses").length || 0;
  const dikirimOrders = orders?.filter(o => o.status === "Dikirim").length || 0;
  const selesaiOrders = orders?.filter(o => o.status === "Selesai").length || 0;
  const dibatalkanOrders = orders?.filter(o => o.status === "Dibatalkan").length || 0;

  const orderStatusItems = [
    {
      label: "Menunggu Pembayaran",
      value: menungguBayarOrders,
      icon: <Banknote size={28} className="text-yellow-500 mx-auto" />,
      href: "/dashboard/orders?status=Menunggu+Pembayaran",
      highlightClass: "border-transparent",
    },
    {
      label: "Menunggu Konfirmasi",
      value: menungguOrders,
      icon: <Clock size={28} className="text-orange-400 mx-auto" />,
      href: "/dashboard/orders?status=Menunggu+Konfirmasi",
      highlightClass: "border-transparent",
    },
    {
      label: "Diproses",
      value: diprosesOrders,
      icon: <Package size={28} className="text-blue-500 mx-auto" />,
      href: "/dashboard/orders?status=Diproses",
      highlightClass: "border-transparent",
    },
    {
      label: "Dikirim",
      value: dikirimOrders,
      icon: <Truck size={28} className="text-indigo-500 mx-auto" />,
      href: "/dashboard/orders?status=Dikirim",
      highlightClass: "border-transparent",
    },
    {
      label: "Selesai",
      value: selesaiOrders,
      icon: <Check size={28} className="text-green-500 mx-auto" />,
      href: "/dashboard/orders?status=Selesai",
      highlightClass: "border-transparent",
    },
    {
      label: "Dibatalkan",
      value: dibatalkanOrders,
      icon: <X size={28} className="text-red-500 mx-auto" />,
      href: "/dashboard/orders?status=Dibatalkan",
      highlightClass: "border-transparent",
    },
  ];

  const stats = [
    {
      label: "Total Produk",
      value: productsCount || 0,
      icon: <Package className="w-5 h-5" />,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Pesanan Masuk",
      value: totalOrders,
      icon: <ShoppingBag className="w-5 h-5" />,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Perlu Diproses",
      value: pendingOrders,
      icon: <Clock className="w-5 h-5" />,
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      label: "Total Pendapatan",
      value: formatPrice(totalRevenue),
      icon: <Wallet className="w-5 h-5" />,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div>
      <Navbar />
      <Container>
        <div className="max-w-6xl mx-auto py-8">

          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard Penjual</h1>
              <p className="text-gray-500 text-sm mt-1 flex items-center gap-1 flex-wrap">
                Toko: <span className="font-semibold text-gray-700">{store.name}</span>
                <span className="mx-1">|</span>
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {store.phone || "Tidak ada nomor telp"}
                </span>
              </p>
            </div>
            <Link href="/dashboard/products/add" className="btn-primary text-sm whitespace-nowrap">
              + Tambah Produk
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="card p-4 flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${stat.color}`}>
                  {stat.icon}
                </div>
                <p className="text-xl font-bold text-gray-800 leading-tight">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Menu Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Link href="/dashboard/products" className="card p-6 hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center">
                  <Package className="w-7 h-7 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 group-hover:text-primary transition-colors">Kelola Produk</h3>
                  <p className="text-sm text-gray-500">{productsCount || 0} produk aktif</p>
                </div>
                <span className="text-gray-300 group-hover:text-primary transition-colors text-xl">→</span>
              </div>
            </Link>
            <Link href="/dashboard/orders" className="card p-6 hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 w-14 h-14 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-7 h-7 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 group-hover:text-primary transition-colors">Kelola Pesanan</h3>
                  <p className="text-sm text-gray-500">{totalOrders} total pesanan</p>
                </div>
                <span className="text-gray-300 group-hover:text-primary transition-colors text-xl">→</span>
              </div>
            </Link>
          </div>

          {/* Manajemen Pesanan */}
          <div className="card p-5 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <ShoppingBag size={18} className="text-primary" />
                Manajemen Pesanan
              </h2>
              <Link href="/dashboard/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
                Kelola semua <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {orderStatusItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`card p-4 text-center hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer border ${item.highlightClass}`}
                >
                  <p className="text-2xl mb-1">{item.icon}</p>
                  <p className="text-2xl font-bold text-primary">{item.value}</p>
                  <p className="text-xs text-gray-500 leading-tight">{item.label}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="card p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800">Pesanan Terbaru</h2>
              <Link href="/dashboard/orders" className="text-sm text-primary hover:underline">
                Lihat semua
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Belum ada pesanan terbaru.</p>
              ) : (
                recentOrders.map((order) => {
                  const oDate = parseSupabaseDate(order.created_at).toLocaleDateString("id-ID", { timeZone: 'Asia/Jakarta' });
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
                        <p className="font-medium text-gray-800">
                          {productStr}{order.order_items.length > 1 ? ` (+${order.order_items.length - 1} lainnya)` : ""}
                        </p>
                        <p className="text-xs text-gray-400">{buyerName} · {oDate}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="font-bold text-gray-800">
                          {formatPrice(order.total_amount + order.shipping_cost + 5000)}
                        </p>
                        <StatusBadge status={order.status} className="text-[10px] px-2 py-0.5" />
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