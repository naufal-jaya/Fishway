import Container from "@/components/Container";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { formatPrice } from "@/lib/data";

const STATUS_COLOR: Record<string, string> = {
  "Menunggu Konfirmasi": "bg-gray-100 text-gray-700",
  "Diproses": "bg-yellow-100 text-yellow-700",
  "Dikirim": "bg-blue-100 text-blue-700",
  "Selesai": "bg-green-100 text-green-700",
};

export default async function BuyerOrdersPage() {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div>
        <Navbar />
        <Container>
          <div className="card p-12 text-center mt-8">
            <p className="text-gray-500 mb-4">Anda harus login untuk melihat pesanan.</p>
          </div>
        </Container>
      </div>
    );
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      total_amount,
      shipping_cost,
      created_at,
      stores ( name ),
      order_items (
        id,
        quantity,
        price,
        products ( name )
      )
    `)
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <Navbar />
      <Container>
        <div className="max-w-4xl mx-auto py-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Pesanan Saya</h1>

          {!orders || orders.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-500 mb-4">Belum ada pesanan</p>
              <Link href="/" className="btn-primary inline-block">
                Mulai Belanja
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => {
                const orderDate = new Date(order.created_at).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });

                return (
                  <div key={order.id} className="card p-5">
                    <div className="flex justify-between items-start mb-4 border-b pb-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          {orderDate} · {order.stores?.name}
                        </p>
                        <p className="font-mono text-xs text-gray-400">ID: {order.id}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLOR[order.status] || "bg-gray-100 text-gray-700"}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {order.order_items.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <div>
                            <span className="font-semibold text-gray-800">{item.products?.name}</span>
                            <span className="text-gray-500 ml-2">x {item.quantity}</span>
                          </div>
                          <span className="text-gray-800 font-medium">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Total Belanja (termasuk ongkir)</p>
                        <p className="text-lg font-bold text-primary">{formatPrice(order.total_amount + order.shipping_cost)}</p>
                      </div>
                      <Link href={`/orders/${order.id}`} className="btn-outline px-4 py-2 text-sm rounded-xl">
                        Lihat Detail
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
