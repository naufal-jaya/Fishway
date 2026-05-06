import Container from "@/components/Container";
import { formatPrice } from "@/lib/data";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

const STATUS_TABS = ["Semua", "Menunggu Konfirmasi", "Diproses", "Dikirim", "Selesai"];

const STATUS_COLOR: Record<string, string> = {
  "Menunggu Konfirmasi": "bg-gray-100 text-gray-700",
  "Diproses": "bg-yellow-100 text-yellow-700",
  "Dikirim": "bg-blue-100 text-blue-700",
  "Selesai": "bg-green-100 text-green-700",
};

export default async function SellerOrdersPage({ searchParams }: { searchParams: { status?: string } }) {
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

  let query = supabase
    .from("orders")
    .select(`
      id,
      status,
      total_amount,
      shipping_cost,
      created_at,
      buyers ( accounts ( name ) ),
      order_items (
        id, quantity, products ( name )
      )
    `)
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  if (currentStatus !== "Semua") {
    query = query.eq("status", currentStatus);
  }

  const { data: orders } = await query;

  return (
    <div>
      <Navbar />
      <Container>
        <div className="max-w-4xl mx-auto py-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/seller"
              className="text-sm text-gray-400 hover:text-primary"
            >
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 mt-1">
              Manajemen Pesanan
            </h1>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {STATUS_TABS.map((tab) => (
              <Link
                key={tab}
                href={`/seller/orders${tab !== "Semua" ? `?status=${tab}` : ""}`}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors ${
                  currentStatus === tab
                    ? "bg-primary text-white border-primary"
                    : "border-gray-300 text-gray-600 hover:border-primary hover:text-primary"
                }`}
              >
                {tab}
              </Link>
            ))}
          </div>

          {/* Orders Table */}
          <div className="card overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-5 gap-4 px-5 py-3 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span className="col-span-2">Pesanan</span>
              <span>Pembeli</span>
              <span>Total</span>
              <span>Status / Aksi</span>
            </div>

            {/* Table Rows */}
            <div className="divide-y">
              {orders && orders.map((order: any) => {
                const orderDate = new Date(order.created_at).toLocaleDateString('id-ID');
                const productsStr = order.order_items.map((i: any) => `${i.products?.name} (${i.quantity})`).join(", ");
                const buyerName = order.buyers?.accounts?.name || "Pembeli";

                return (
                  <div
                    key={order.id}
                    className="p-5 md:grid md:grid-cols-5 gap-4 items-center hover:bg-gray-50 transition-colors"
                  >
                    <div className="col-span-2 mb-2 md:mb-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {productsStr}
                      </p>
                      <p className="text-xs text-gray-400">
                        {order.id.split("-")[0]} · {orderDate}
                      </p>
                    </div>
                    <div className="mb-2 md:mb-0">
                      <p className="text-sm text-gray-600 truncate">{buyerName}</p>
                    </div>
                    <div className="mb-2 md:mb-0">
                      <p className="font-bold text-gray-800 text-sm">
                        {formatPrice(order.total_amount + order.shipping_cost)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[order.status] || "bg-gray-100 text-gray-700"}`}
                      >
                        {order.status}
                      </span>
                      <Link 
                        href={`/seller/orders/${order.id}`}
                        className="text-xs bg-primary text-white px-3 py-1 rounded-full hover:bg-primary/90 transition-colors"
                      >
                        Detail
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Empty State */}
          {(!orders || orders.length === 0) && (
            <div className="card p-12 text-center mt-4">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-500">Belum ada pesanan {currentStatus !== "Semua" ? `dengan status ${currentStatus}` : "masuk"}</p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
