import Container from "@/components/Container";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { formatPrice } from "@/lib/data";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { revalidatePath } from "next/cache";

const STATUS_COLOR: Record<string, string> = {
  "Menunggu Konfirmasi": "bg-gray-100 text-gray-700",
  "Diproses": "bg-yellow-100 text-yellow-700",
  "Dikirim": "bg-blue-100 text-blue-700",
  "Selesai": "bg-green-100 text-green-700",
};

const ALL_STATUSES = ["Menunggu Konfirmasi", "Diproses", "Dikirim", "Selesai"];

export default async function SellerOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return notFound();

  // Validate ownership
  const { data: store } = await supabase.from("stores").select("id").eq("seller_id", user.id).maybeSingle();
  if (!store) return notFound();

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      total_amount,
      shipping_cost,
      created_at,
      buyers (
        phone,
        accounts ( name, address )
      ),
      order_items (
        id, quantity, price,
        products ( name, gambar, unit )
      )
    `)
    .eq("id", params.id)
    .eq("store_id", store.id)
    .maybeSingle();

  if (error || !order) return notFound();

  const orderDate = new Date(order.created_at).toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const buyerInfo = Array.isArray(order.buyers) ? order.buyers[0] : order.buyers;
  const accountData = buyerInfo && Array.isArray((buyerInfo as any).accounts) 
    ? (buyerInfo as any).accounts[0] 
    : (buyerInfo as any)?.accounts;
    
  const buyerName = accountData?.name || "Pembeli";
  const buyerPhone = (buyerInfo as any)?.phone || "Tidak ada nomor";
  const buyerAddress = accountData?.address || "Tidak ada alamat";

  async function updateStatus(formData: FormData) {
    "use server";
    const newStatus = formData.get("status") as string;
    if (!newStatus || !ALL_STATUSES.includes(newStatus)) return;

    const supabaseAdmin = createClient(cookies());
    await supabaseAdmin
      .from("orders")
      .update({ status: newStatus })
      .eq("id", params.id);
    
    revalidatePath(`/seller/orders/${params.id}`);
  }

  return (
    <div>
      <Navbar />
      <Container>
        <div className="max-w-3xl mx-auto py-8">
          <Link href="/seller/orders" className="text-sm text-gray-500 hover:text-primary mb-6 inline-block">
            ← Kembali ke Daftar Pesanan
          </Link>
          
          <div className="card p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8 border-b pb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Detail Pesanan</h1>
                <p className="text-sm text-gray-500 font-mono">ID: {order.id}</p>
                <p className="text-sm text-gray-500 mt-1">Dibuat pada: {orderDate}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <form action={updateStatus} className="flex items-center gap-3">
                  <label htmlFor="status" className="text-sm font-semibold text-gray-700">Status:</label>
                  <select 
                    name="status" 
                    id="status"
                    defaultValue={order.status}
                    className="border-gray-300 rounded-lg text-sm bg-white focus:ring-primary focus:border-primary"
                  >
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button type="submit" className="btn-primary py-1.5 px-3 text-xs rounded-lg">Update</button>
                </form>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Informasi Pembeli</h2>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                <p className="font-semibold text-gray-800">{buyerName}</p>
                <div className="text-sm text-gray-600 flex items-center gap-3">
                  <span className="flex items-center gap-2">📞 {buyerPhone}</span>
                  {buyerPhone !== "Tidak ada nomor" && (
                    <a 
                      href={`https://wa.me/${buyerPhone.replace(/\D/g, '')}?text=Halo%20${encodeURIComponent(buyerName)},%20saya%20dari%20toko%20ingin%20mengonfirmasi%20pesanan%20Anda%20dengan%20ID%20${order.id}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-green-600 transition-colors flex items-center gap-1"
                    >
                      💬 Hubungi via WA
                    </a>
                  )}
                </div>
                <p className="text-sm text-gray-600 flex items-start gap-2">
                  <span>📍</span> {buyerAddress}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Daftar Produk</h2>
              <div className="space-y-4">
                {order.order_items.map((item: any) => {
                  const productInfo = Array.isArray(item.products) ? item.products[0] : item.products;
                  return (
                    <div key={item.id} className="flex gap-4 items-center p-3 border border-gray-100 rounded-xl">
                      <div className="w-16 h-16 bg-blue-50 rounded-lg overflow-hidden relative flex-shrink-0">
                        <Image 
                          src={productInfo?.gambar || "/images/default.png"} 
                          alt={productInfo?.name || "Produk"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{productInfo?.name}</p>
                        <p className="text-sm text-gray-500">{item.quantity} {productInfo?.unit || "Unit"} x {formatPrice(item.price)}</p>
                      </div>
                      <div className="text-right font-bold text-gray-800">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="w-full md:w-1/2 ml-auto space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal Produk</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Ongkos Kirim</span>
                  <span>{formatPrice(order.shipping_cost)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-800 pt-3 border-t">
                  <span>Total Pesanan</span>
                  <span className="text-primary">{formatPrice(order.total_amount + order.shipping_cost)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
