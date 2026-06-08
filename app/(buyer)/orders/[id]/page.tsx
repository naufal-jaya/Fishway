import Container from "@/components/Container";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { formatPrice, ORDER_STATUS_COLORS } from "@/lib/data";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Phone, MessageCircle, ChevronLeft, X } from "lucide-react";
import AcceptCancelButton from "./AcceptCancelButton";
import ContinuePaymentButton from "@/components/ContinuePaymentButton";
import OrderStatusPoller from "@/components/OrderStatusPoller";
import { revalidatePath } from "next/cache";

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
      shipping_name,
      shipping_phone,
      shipping_address,
      shipping_method,
      buyer_note,
      created_at,
      notes,
      cancel_reason,
      stores ( id, name, phone ),
      order_items (
        id,
        quantity,
        price,
        products ( name, gambar, unit, product_images(url, sort_order) )
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

  const waLink = `https://wa.me/${waNumber.replace(/\D/g, '')}?text=${encodeURIComponent(waMessage)}`;

  const waRefundMessage = `Hai, saya mau konfirmasi pembatalan pesanan ${order.id}, tolong kirim ke rekening saya saya dengan detail:
Bank: 
No Rek: 
A/N: `;

  const waRefundLink = `https://wa.me/${waNumber.replace(/\D/g, '')}?text=${encodeURIComponent(waRefundMessage)}`;

  // Server action: accept cancellation
  async function acceptCancel() {
    "use server";

    const supabase = createClient(cookies());
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Accept cancel auth error:", userError);
      return;
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = serviceRoleKey
      ? createSupabaseAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
      : supabase;

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ status: "Dibatalkan" })
      .eq("id", params.id)
      .eq("buyer_id", user.id)
      .eq("status", "Proses Pembatalan")
      .select("id, store_id")
      .maybeSingle();

    if (updateError) {
      console.error("Accept cancel update error:", updateError);
      return;
    }

    if (!updatedOrder) {
      console.error("Accept cancel update skipped: no matching order", {
        orderId: params.id,
        buyerId: user.id,
      });
      return;
    }

    // Notify seller
    const { data: storeOwner } = await supabaseAdmin
      .from("stores")
      .select("seller_id")
      .eq("id", updatedOrder.store_id)
      .maybeSingle();

    if (storeOwner?.seller_id) {
      await supabaseAdmin.from("notifications").insert({
        user_id: storeOwner.seller_id,
        title: "Pembatalan Disetujui",
        message: `Pembeli telah menyetujui pembatalan pesanan ${params.id}.`,
        link: `/dashboard/orders/${params.id}`,
      });
    }

    revalidatePath(`/orders/${params.id}`);
    revalidatePath("/orders");
    revalidatePath(`/dashboard/orders/${params.id}`);
    revalidatePath("/dashboard/orders");
  }

  return (
    <div>
      <Navbar />
      <Container>
        <div className="max-w-3xl mx-auto py-8">
          <Link href="/orders" className="inline-flex items-center text-gray-400 hover:text-[#407BB5] mb-6">
            <ChevronLeft className="w-5 h-5" />
          </Link>

          {/* Polling otomatis saat status masih Menunggu Pembayaran */}
          {order.status === "Menunggu Pembayaran" && (
            <OrderStatusPoller orderId={order.id} />
          )}

          <div className="card p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8 border-b pb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Detail Pesanan</h1>
                <p className="text-sm text-gray-500 font-mono">ID: {order.id}</p>
                <p className="text-sm text-gray-500 mt-1">Dibuat pada: {orderDate}</p>
                {order.buyer_note && (
                  <div className="mt-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Catatan Anda:</p>
                    <p className="text-sm text-gray-800 italic">"{order.buyer_note}"</p>
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className={`px-4 py-2 rounded-full font-semibold text-sm inline-block ${ORDER_STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}`}>
                  {order.status}
                </span>
              </div>
            </div>

          {/* Banner Lanjutkan Pembayaran */}
          {order.status === "Menunggu Pembayaran" && (
            <div className="mb-8 p-5 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-yellow-800 font-bold text-base mb-1">Pesanan Belum Dibayar</h3>
                  <p className="text-sm text-yellow-700">
                    Selesaikan pembayaran sekarang untuk memproses pesananmu.
                  </p>
                </div>
                <ContinuePaymentButton
                  orderId={order.id}
                  totalAmount={order.total_amount + order.shipping_cost + 5000}
                  customerName={order.shipping_name || undefined}
                  customerPhone={order.shipping_phone || undefined}
                />
              </div>
            </div>
          )}

            {order.status === "Proses Pembatalan" && (
              <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 p-2 rounded-full text-red-600 mt-0.5">
                    <X size={20} className="lucide lucide-x-circle" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-red-800 font-bold text-lg mb-1">Menunggu Persetujuan Pembatalan</h3>
                    <p className="text-sm text-red-700 mb-4 leading-relaxed">
                      Ups! pesanan kamu terkendala, <strong>{order.cancel_reason || "Penjual mengajukan pembatalan"}</strong>. Hubungi penjual untuk refund.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href={waRefundLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <MessageCircle size={16} />
                        Hubungi Penjual (Refund)
                      </a>
                      <AcceptCancelButton action={acceptCancel} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Informasi Toko</h2>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="font-semibold text-gray-800 text-lg">{sellerName}</p>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <Phone size={14} /> {waNumber}
                </p>
              </div>
            </div>

            {order.notes && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-800 mb-3">Catatan Pesanan</h2>
                <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-xl text-sm text-amber-900">
                  <p className="leading-relaxed font-medium">{order.notes}</p>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Informasi Pengiriman</h2>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="font-semibold text-gray-800 text-lg">{order.shipping_name || "Pemesan"}</p>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <Phone size={14} /> {order.shipping_phone || "-"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {order.shipping_address || "-"}
                </p>
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Metode Pengiriman</p>
                  <p className="text-sm font-medium text-gray-800">{order.shipping_method || "Reguler"}</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Daftar Produk</h2>
              <div className="space-y-4">
                {order.order_items.map((item: any) => {
                  const productInfo = Array.isArray(item.products) ? item.products[0] : item.products;
                  const pImages = Array.isArray(productInfo?.product_images) ? productInfo.product_images : [];
                  const firstImage = pImages.length > 0
                    ? [...pImages].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))[0]?.url
                    : null;
                  return (
                    <div key={item.id} className="flex gap-4 items-center p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-16 h-16 bg-blue-50 rounded-lg overflow-hidden relative flex-shrink-0">
                        <Image
                          src={firstImage || productInfo?.gambar || "/images/default.png"}
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
                  <span>Biaya Admin</span>
                  <span>{formatPrice(5000)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Ongkos Kirim</span>
                  <span>{formatPrice(order.shipping_cost)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-800 pt-3 border-t">
                  <span>Total Pesanan</span>
                  <span className="text-primary">{formatPrice(order.total_amount + order.shipping_cost + 5000)}</span>
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
                className="bg-green-500 hover:bg-green-600 text-white whitespace-nowrap px-6 py-3 rounded-xl flex items-center gap-2 w-full md:w-auto justify-center font-medium transition"
              >
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.17 1.541 5.943L.057 23.571a.5.5 0 00.6.633l5.782-1.457A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.877 9.877 0 01-5.031-1.378l-.36-.214-3.733.941.993-3.608-.235-.372A9.833 9.833 0 012.106 12C2.106 6.533 6.533 2.106 12 2.106S21.894 6.533 21.894 12 17.467 21.894 12 21.894z" />
                </svg>
                Hubungi Penjual
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
