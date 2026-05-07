import Container from "@/components/Container";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { formatPrice } from "@/lib/data";
import { notFound } from "next/navigation";
import Image from "next/image";

const STATUS_COLOR: Record<string, string> = {
  "Menunggu Konfirmasi": "bg-gray-100 text-gray-700",
  "Diproses": "bg-yellow-100 text-yellow-700",
  "Dikirim": "bg-blue-100 text-blue-700",
  "Selesai": "bg-green-100 text-green-700",
};

export default async function BuyerOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      total_amount,
      shipping_cost,
      created_at,
      stores ( name, phone ),
      order_items (
        id,
        quantity,
        price,
        products ( name, gambar, unit )
      )
    `)
    .eq("id", params.id)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (error || !order) {
    return notFound();
  }

  const orderDate = new Date(order.created_at).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Siapkan pesan WA
  const sellerInfo = Array.isArray(order.stores) ? order.stores[0] : order.stores;
  const waNumber = (sellerInfo as any)?.phone || "6281234567890";
  const sellerName = (sellerInfo as any)?.name || "Penjual";
  
  let itemsList = "";
  order.order_items.forEach((item: any, index: number) => {
    itemsList += `${index + 1}. ${item.products?.name} - ${item.quantity} x ${formatPrice(item.price)}\n`;
  });
  
  const waMessage = `Halo ${sellerName}, saya ingin konfirmasi pesanan saya:
ID Pesanan: ${order.id}
Tanggal: ${orderDate}

Daftar Barang:
${itemsList}
Total Pembayaran (termasuk ongkir): ${formatPrice(order.total_amount + order.shipping_cost)}

Mohon diproses ya. Terima kasih!`;

  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div>
      <Navbar />
      <Container>
        <div className="max-w-3xl mx-auto py-8">
          <Link href="/orders" className="text-sm text-gray-500 hover:text-primary mb-6 inline-block">
            ← Kembali ke Daftar Pesanan
          </Link>
          
          <div className="card p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8 border-b pb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Detail Pesanan</h1>
                <p className="text-sm text-gray-500 font-mono">ID: {order.id}</p>
                <p className="text-sm text-gray-500 mt-1">Dibuat pada: {orderDate}</p>
              </div>
              <div className="text-right">
                <span className={`px-4 py-2 rounded-full font-semibold text-sm inline-block ${STATUS_COLOR[order.status] || "bg-gray-100 text-gray-700"}`}>
                  {order.status}
                </span>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Informasi Toko</h2>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="font-semibold text-gray-800 text-lg">{sellerName}</p>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <span>📞</span> {waNumber}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Daftar Produk</h2>
              <div className="space-y-4">
                {order.order_items.map((item: any) => {
                  const productInfo = Array.isArray(item.products) ? item.products[0] : item.products;
                  return (
                    <div key={item.id} className="flex gap-4 items-center p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
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

            <div className="border-t pt-6 mb-8">
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

            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-800 mb-1">Butuh bantuan pesanan?</p>
                <p className="text-sm text-gray-600">Hubungi penjual melalui WhatsApp untuk konfirmasi pembayaran atau pengiriman.</p>
              </div>
              <Link 
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary whitespace-nowrap px-6 py-3 rounded-xl flex items-center gap-2 w-full md:w-auto justify-center"
              >
                <span>💬</span> Hubungi Penjual
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
