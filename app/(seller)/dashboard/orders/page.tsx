import Container from "@/components/Container";
import { formatPrice, ORDER_STATUSES, parseSupabaseDate } from "@/lib/data";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Pencil, Trash, ChevronLeft, ChevronRight, PackageOpen } from "lucide-react";
import OrderTableHeader from "@/components/OrderTableHeader";
import OrderPagination from "@/components/OrderPagination";
import BackButton from "@/components/BackButton";
import { Suspense } from "react";

const STATUS_TABS = ["Semua", ...ORDER_STATUSES];

export default async function SellerOrdersPage({ searchParams }: { searchParams: { status?: string; q?: string; date?: string; page?: string } }) {
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

  const perPage = 10;
  const currentPage = Number(searchParams.page || 1);

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
const buyerIds = (orders || []).reduce<string[]>((ids, order: any) => {
  return ids.includes(order.buyer_id) ? ids : [...ids, order.buyer_id];
}, []);

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
    const parsedDate = parseSupabaseDate(order.created_at);
    const orderDateStr = parsedDate.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    if (dateFilter === "today") {
      const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
      matchDate = orderDateStr === todayStr;
    } else if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchDate = parsedDate >= weekAgo;
    } else if (dateFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchDate = parsedDate >= monthAgo;
    }
  }

  return matchSearch && matchDate;
});

const paginatedOrders = filteredOrders.slice(
  (currentPage - 1) * perPage,
  currentPage * perPage
);


  return (
    <div>
      <Navbar />
      <Container>
          {/* Header */}
          <div className="mb-6">
            <BackButton href="/dashboard" />
            <h1 className="text-2xl font-bold text-gray-800 mt-1">
              Manajemen Pesanan
            </h1>
          </div>

        {/* Orders Table */}
        <div className="card overflow-visible">

          {/* Search + Title di dalam card */}
        <OrderTableHeader currentStatus={currentStatus} currentDate={dateFilter} />

            {/* Table Header */}
          <div className="hidden md:grid grid-cols-8 gap-4 items-center px-5 py-3 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
              {paginatedOrders.map((order: any) => {
                const parsedDate = parseSupabaseDate(order.created_at);
                const orderDate = parsedDate.toLocaleDateString("id-ID", {
                  timeZone: 'Asia/Jakarta',
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                const orderTime = parsedDate.toLocaleTimeString("id-ID", {
                  timeZone: 'Asia/Jakarta',
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }).replace(".", ":") + " WIB";
                const productsStr = order.order_items.map((i: any) => {
                  const productInfo = Array.isArray(i.products) ? i.products[0] : i.products;
                  return `${productInfo?.name || "Produk"} (${i.quantity})`;
                }).join(", ");
                
                const buyerName = buyerMap.get(order.buyer_id) || "Pembeli";

                return (
<div key={order.id} className="relative hover:bg-gray-50 transition-colors">
  
  {/* Mobile view */}
  <div className="md:hidden p-4">
    <div className="flex items-start justify-between mb-2">
      <div>
        <p className="text-sm font-medium text-gray-800">{orderDate} • {orderTime}</p>
        <p className="text-xs text-gray-400 font-mono">#{order.id.split("-")[0].toUpperCase()}</p>
      </div>
      <StatusBadge status={order.status} className="text-[10px] px-2 py-0.5" />
    </div>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{buyerName}</p>
        <p className="text-xs text-gray-400">{order.order_items.length} item</p>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-bold text-gray-800">
          {formatPrice(order.total_amount + order.shipping_cost + 5000)}
        </p>
        <Link href={`/dashboard/orders/${order.id}`} className="text-gray-400 hover:text-primary transition-colors">
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  </div>

  {/* Desktop view */}
  <div className="hidden md:grid md:grid-cols-8 gap-4 items-center p-5">
    <div className="col-span-2">
      <p className="text-sm font-medium text-gray-800">{orderDate}</p>
      <p className="text-xs text-gray-400">
        {orderTime}
      </p>
    </div>
    <div className="text-center">
      <p className="text-sm text-gray-600 font-mono">#{order.id.split("-")[0].toUpperCase()}</p>
    </div>
    <div>
      <p className="text-sm text-gray-600 truncate">{buyerName}</p>
    </div>
    <div className="text-center">
      <p className="text-sm text-gray-600">{order.order_items.length} item</p>
    </div>
    <div className="text-right">
      <p className="text-sm font-bold text-gray-800">
        {formatPrice(order.total_amount + order.shipping_cost + 5000)}
      </p>
    </div>
    <div className="flex justify-center">
    <StatusBadge status={order.status} className="text-[10px] px-3 py-1" />
    </div>
    <div className="flex justify-center">
      <Link href={`/dashboard/orders/${order.id}`} className="text-gray-400 hover:text-primary transition-colors">
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  </div>

  {/* Divider */}
  {paginatedOrders.indexOf(order) !== paginatedOrders.length - 1 && (
    <div className="absolute bottom-0 left-5 right-5 h-px bg-gray-200"></div>
  )}
</div>
                  
                );
              })}
            </div>

          <Suspense fallback={null}>
            <OrderPagination total={filteredOrders.length} perPage={perPage} />
          </Suspense>

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
      </Container>
    </div>
  );
}
