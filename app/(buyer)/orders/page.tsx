import Container from "@/components/Container";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import OrderFilter from "@/components/OrderFilter";
import { PackageOpen } from "lucide-react";

export default async function BuyerOrdersPage({ searchParams }: { searchParams: { status?: string } }) {
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

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      total_amount,
      shipping_cost,
      shipping_method,
      created_at,
      stores ( id, name ),
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
        <div className="max-w-6xl mx-auto py-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Pesanan Saya</h1>

          {!orders || orders.length === 0 ? (
            <div className="card p-12 text-center flex flex-col items-center">
              <PackageOpen size={48} className="text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">Belum ada pesanan</p>
              <Link href="/" className="btn-primary inline-block">Mulai Belanja</Link>
            </div>
          ) : (
            <OrderFilter orders={orders} initialStatus={searchParams.status} />
          )}
        </div>
      </Container>
    </div>
  );
}