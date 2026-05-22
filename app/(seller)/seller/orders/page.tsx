import Container from "@/components/Container";
import { formatPrice } from "@/lib/data";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Pencil, Trash, ChevronLeft, ChevronRight, PackageOpen } from "lucide-react";
import OrderTableHeader from "@/components/OrderTableHeader";

const STATUS_TABS = ["Semua", "Menunggu Konfirmasi", "Diproses", "Dikirim", "Selesai"];

const STATUS_COLOR: Record<string, string> = {
  "Menunggu Konfirmasi": "bg-orange-100 text-orange-500",
  "Diproses": "bg-blue-100 text-blue-500",
  "Dikirim": "bg-purple-100 text-purple-500",
  "Selesai": "bg-green-100 text-green-500",
};

export default async function SellerOrdersPage({ searchParams }: { searchParams: { status?: string; q?: string; date?: string } }) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get seller's store
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("seller_id", user.id)
    .maybeSingle();

  if (!store) {
    return (
      <div>
        <Navbar />
        <Container>
          <div className="card p-12 text-center mt-8">
            <p className="text-gray-500">Anda belum memiliki toko.</p>
          </div>
        </Container>
      </div>
    );
  }

  const currentStatus = searchParams.status || "Semua";

  const searchQuery = searchParams.q || "";

  const dateFilter = searchParams.date || "";

  let query = supabase
    .from("orders")
    .select(`
      id,
      buyer_id,
      status,
      total_amount,
      shipping_cost,
      created_at,

      order_items (
        id,
        quantity,
        products ( name )
      )
    `)
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });
      
  if (currentStatus !== "Semua") {
    query = query.eq("status", currentStatus);
  }

  const { data: orders } = await query;

// Ambil semua buyer_id unik dari orders
const buyerIds = [...new Set((orders || []).map((o: any) => o.buyer_id))];

// Fetch nama pembeli dari tabel accounts
const { data: accountsData } = await supabase
  .from("accounts")
  .select("id, name")
  .in("id", buyerIds);

// Buat map: buyer_id -> nama
const buyerMap = new Map((accountsData || []).map((a) => [a.id, a.name]));

const filteredOrders = (orders || []).filter((order: any) => {
  const buyerName = buyerMap.get(order.buyer_id) || "";
  const invoice = "#" + order.id.split("-")[0].toUpperCase();
  const q = searchQuery.toLowerCase();
  const matchSearch = !q || buyerName.toLowerCase().includes(q) || invoice.toLowerCase().includes(q);

  let matchDate = true;
  if (dateFilter) {
    const orderDate = new Date(order.created_at).toISOString().split("T")[0];
    if (dateFilter === "today") {
      matchDate = orderDate === new Date().toISOString().split("T")[0];
    } else if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchDate = new Date(order.created_at) >= weekAgo;
    } else if (dateFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchDate = new Date(order.created_at) >= monthAgo;
    }
  }

  return matchSearch && matchDate;
});


  return (
    <div>
      <Navbar />
      <Container>
        <div className="max-w-5xl mx-auto py-8">
          {/* Header */}
          <div className="mb-6">
          <Link href="/seller" className="inline-flex items-center text-gray-400 hover:text-[#407BB5]">
            <ChevronLeft className="w-5 h-5" />
          </Link>
            <h1 className="text-2xl font-bold text-gray-800 mt-1">
              Manajemen Pesanan
            </h1>
          </div>

        {/* Orders Table */}
        <div className="card overflow-visible">

          {/* Search + Title di dalam card */}
        <OrderTableHeader currentStatus={currentStatus} currentDate={dateFilter} />

            {/* Table Header */}
          <div className="hidden md:grid grid-cols-8 gap-4 items-center px-5 py-3 hidden md:grid grid-cols-8 gap-4 px-5 py-3 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span className="col-span-2">Tanggal</span>
            <span className="text-center">Invoice</span>
            <span>Pembeli</span>
            <span className="text-center">Total Item</span>
            <span className="text-center">Total Harga</span>
            <span className="text-center">Status</span>
            <span className="text-center">Detail</span>
          </div>

            {/* Table Rows */}
            <div>
              {filteredOrders.map((order: any) => {
                const orderDate = new Date(order.created_at).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                const productsStr = order.order_items.map((i: any) => {
                  const productInfo = Array.isArray(i.products) ? i.products[0] : i.products;
                  return `${productInfo?.name || "Produk"} (${i.quantity})`;
                }).join(", ");
                
                const buyerName = buyerMap.get(order.buyer_id) || "Pembeli";

                return (
                <div
                  key={order.id}
                  className="relative p-5 md:grid md:grid-cols-8 gap-4 items-center hover:bg-gray-50 transition-colors"
                >
                    <div className="col-span-2 mb-2 md:mb-0">
                      <p className="text-sm font-medium text-gray-800">{orderDate}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                          .replace(".", ":")}
                        </p>
                    </div>
                    <div className="mb-2 md:mb-0 text-center">
                      <p className="text-sm text-gray-600 font-mono">#{order.id.split("-")[0].toUpperCase()}</p>
                    </div>
                    <div className="mb-2 md:mb-0">
                      <p className="text-sm text-gray-600 truncate">{buyerName}</p>
                    </div>
                    <div className="mb-2 md:mb-0 text-center">
                      <p className="text-sm text-gray-600">{order.order_items.length} item</p>
                    </div>
                    <div className="mb-2 md:mb-0 text-right">
                      <p className="text-sm font-bold text-gray-800">
                        {formatPrice(order.total_amount + order.shipping_cost)}
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLOR[order.status] || "bg-gray-100 text-gray-700"}`}
                      >
                        • {order.status}
                      </span>
                    </div>
                  <div className="flex justify-center">
                    <Link 
                      href={`/seller/orders/${order.id}`}
                      className="text-gray-400 hover:text-primary transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Divider */}
                  {filteredOrders.indexOf(order) !== filteredOrders.length - 1 && (
                  <div className="absolute bottom-0 left-5 right-5 h-px bg-gray-200"></div>
                  )}

                  </div>
                  
                );
              })}
            </div>
          </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="card p-12 text-center mt-4 flex flex-col items-center">
            <PackageOpen className="w-14 h-14 text-gray-300 mb-3" />

            <p className="text-gray-500 text-sm">
              Belum ada pesanan{" "}
              {currentStatus !== "Semua"
                ? `dengan status ${currentStatus}`
                : "masuk"}
            </p>
          </div>
        )}
        </div>
      </Container>
    </div>
  );
}
