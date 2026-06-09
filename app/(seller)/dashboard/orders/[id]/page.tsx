import Container from "@/components/Container";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { formatPrice, ORDER_STATUSES, ORDER_STATUS_TRANSITIONS } from "@/lib/data";
import { notFound } from "next/navigation";
import Image from "next/image";
import { revalidatePath } from "next/cache";
import CancelOrderButton from "./CancelOrderButton";
import { Phone, MapPin, XCircle, ChevronLeft } from "lucide-react";



export default async function SellerOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return notFound();

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("seller_id", user.id)
    .maybeSingle();

  if (!store) return notFound();

  // Fetch order — .eq("store_id", store.id) memastikan seller hanya bisa akses ordernya sendiri
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      total_amount,
      shipping_cost,
      created_at,
      notes,
      buyer_note,
      buyer_id,
      shipping_name,
      shipping_phone,
      shipping_address,
      shipping_method,
      store_id,
      order_items (
        id, quantity, price,
        products ( id, name, category, gambar, unit, store_id, product_images(url, sort_order) )
      )
    `)
    .eq("id", params.id)
    .eq("store_id", store.id)
    .maybeSingle();

  if (error || !order) return notFound();

  // Filter order_items: hanya tampilkan produk yang memang milik toko ini
  // Ini lapisan keamanan kedua — seharusnya sudah beres dari query store_id di orders,
  // tapi ini mencegah edge case jika ada produk dengan store_id berbeda masuk ke order
  const safeOrderItems = (order.order_items as any[]).filter((item) => {
    const product = Array.isArray(item.products) ? item.products[0] : item.products;
    return product?.store_id === store.id;
  });

  const hasIkanHias = safeOrderItems.some((item) => {
    const product = Array.isArray(item.products) ? item.products[0] : item.products;
    return product?.category === "Ikan Hias";
  });

  const orderDate = new Date(order.created_at).toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const buyerName = order.shipping_name || "Pembeli";
  const buyerPhone = order.shipping_phone || "Tidak ada nomor";
  const buyerAddress = order.shipping_address || "Tidak ada alamat";

  // Server action: update status
  async function updateStatus(formData: FormData) {
    "use server";
    const newStatus = formData.get("status") as string;
    if (!newStatus || !ORDER_STATUSES.includes(newStatus as any)) return;

    const supabaseAdmin = createClient(cookies());

    const { data: currentOrder } = await supabaseAdmin
      .from("orders")
      .select("status, buyer_id")
      .eq("id", params.id)
      .maybeSingle();

    if (!currentOrder) return;

    const allowedNextStatuses = ORDER_STATUS_TRANSITIONS[currentOrder.status] || [];
    if (!allowedNextStatuses.includes(newStatus as any)) return;

    await supabaseAdmin
      .from("orders")
      .update({ status: newStatus })
      .eq("id", params.id);

    if (currentOrder?.buyer_id) {
      await supabaseAdmin.from("notifications").insert({
        user_id: currentOrder.buyer_id,
        title: "Status Pesanan Diperbarui",
        message: `Pesanan Anda sekarang berstatus: ${newStatus}`,
        link: `/orders/${params.id}`,
      });
    }

    revalidatePath(`/dashboard/orders/${params.id}`);
  }

  // Server action: cancel order
  async function cancelOrder(formData: FormData) {
    "use server";

    const deadItemsStr = formData.get("deadItems") as string;
    let cancelReason = "Ikan mati saat pengiriman";
    if (deadItemsStr) {
      cancelReason = `JSON_DATA:${deadItemsStr}`;
    }

    const supabaseAdmin = createClient(cookies());
    const { data: currentOrder } = await supabaseAdmin
      .from("orders")
      .select("status, buyer_id")
      .eq("id", params.id)
      .maybeSingle();

    if (!currentOrder) return;

    if (currentOrder.status !== "Dikirim") return;

    await supabaseAdmin
      .from("orders")
      .update({
        status: "Proses Pembatalan",
        cancel_reason: cancelReason
      })
      .eq("id", params.id);

    if (currentOrder.buyer_id) {
      await supabaseAdmin.from("notifications").insert({
        user_id: currentOrder.buyer_id,
        title: "Refund Ikan Mati Diajukan",
        message: `Penjual mengajukan pembatalan karena ada ikan mati saat pengiriman. Harap periksa detail pesanan Anda.`,
        link: `/orders/${params.id}`,
      });
    }

    revalidatePath(`/dashboard/orders/${params.id}`);
  }

  return (
    <div>
      <Navbar />
      <Container>
        <div className="max-w-3xl mx-auto py-8">
          <Link href="/dashboard/orders" className="inline-flex items-center text-gray-400 hover:text-[#407BB5] mb-6">
            <ChevronLeft className="w-5 h-5" />
          </Link>

          <div className="card p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8 border-b pb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Detail Pesanan</h1>
                <p className="text-sm text-gray-500 font-mono">ID: {order.id}</p>
                <p className="text-sm text-gray-500 mt-1">Dibuat pada: {orderDate}</p>
              </div>

              {(() => {
                const allowedTransitions = ORDER_STATUS_TRANSITIONS[order.status] || [];

                if (allowedTransitions.length > 0) {
                  return (
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <form action={updateStatus} className="flex items-center gap-3">
                        <label htmlFor="status" className="text-sm font-semibold text-gray-700">Status:</label>
                        <select
                          name="status"
                          id="status"
                          defaultValue={order.status}
                          className="border-gray-300 rounded-lg text-sm bg-white focus:ring-primary focus:border-primary"
                        >
                          <option value={order.status} disabled>{order.status}</option>
                          {allowedTransitions.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button type="submit" className="btn-primary py-1.5 px-3 text-xs rounded-lg">Update</button>
                      </form>
                    </div>
                  );
                }

                if (order.status === "Menunggu Pembayaran") {
                  return <span className="text-sm font-semibold text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-200">Menunggu pembayaran pembeli</span>;
                } else if (order.status === "Dibatalkan") {
                  return (
                    <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-semibold bg-red-100 text-red-700">
                      <XCircle className="w-4 h-4" /> Pesanan Dibatalkan
                    </span>
                  );
                } else if (order.status === "Proses Pembatalan") {
                  return <span className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">Proses Pembatalan</span>;
                } else if (order.status === "Selesai") {
                  return <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">Pesanan Selesai</span>;
                }

                return null;
              })()}
            </div>

            {/* Informasi Pembeli */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Informasi Pembeli</h2>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                <p className="font-semibold text-gray-800">{buyerName}</p>
                <div className="text-sm text-gray-600 flex items-center gap-3">
                  <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> {buyerPhone}</span>
                  {buyerPhone !== "Tidak ada nomor" && (
                    <a
                      href={`https://wa.me/${buyerPhone.replace(/\D/g, '')}?text=Halo%20${encodeURIComponent(buyerName)},%20saya%20dari%20toko%20ingin%20mengonfirmasi%20pesanan%20Anda%20dengan%20ID%20${order.id}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-green-600 transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.17 1.541 5.943L.057 23.571a.5.5 0 00.6.633l5.782-1.457A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.877 9.877 0 01-5.031-1.378l-.36-.214-3.733.941.993-3.608-.235-.372A9.833 9.833 0 012.106 12C2.106 6.533 6.533 2.106 12 2.106S21.894 6.533 21.894 12 17.467 21.894 12 21.894z" />
                      </svg>
                      WhatsApp
                    </a>
                  )}
                </div>
                <p className="text-sm text-gray-600 flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" /> {buyerAddress}
                </p>
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Metode Pengiriman</p>
                  <p className="text-sm font-medium text-gray-800">{order.shipping_method || "Reguler"}</p>
                </div>
              </div>
            </div>

            {(order.notes || order.buyer_note) && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-800 mb-3">Catatan Pembeli</h2>
                <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-xl text-sm text-amber-900">
                  <p className="leading-relaxed font-medium">{order.notes || order.buyer_note}</p>
                </div>
              </div>
            )}

            {/* Daftar Produk — hanya produk milik toko ini */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Daftar Produk</h2>
              <div className="space-y-4">
                {safeOrderItems.map((item: any) => {
                  const productInfo = Array.isArray(item.products) ? item.products[0] : item.products;
                  const pImages = Array.isArray(productInfo?.product_images) ? productInfo.product_images : [];
                  const firstImage = pImages.length > 0
                    ? [...pImages].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))[0]?.url
                    : null;
                  return (
                    <div key={item.id} className="flex gap-4 items-center p-3 border border-gray-100 rounded-xl">
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

            {/* Total — dihitung dari safeOrderItems saja */}
            <div className="border-t pt-6">
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

            {(order.status === "Dikirim" && hasIkanHias) && (
              <CancelOrderButton action={cancelOrder} buyerPhone={buyerPhone} orderId={order.id} orderItems={safeOrderItems} orderDate={orderDate} />
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}