import Container from "@/components/Container";
import { formatPrice } from "@/lib/data";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Pencil, Trash, ChevronLeft } from "lucide-react";
import Image from "next/image";
import DeleteProductButton from "@/components/DeleteProductButton";
import ProductSearchBar from "@/components/ProductSearchBar";
import BackButton from "@/components/BackButton";
import { Suspense } from "react";

export default async function SellerProductsPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch the seller's store
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("seller_id", user.id)
    .maybeSingle();

  let myProducts: any[] = [];
  const productSales: Record<string, number> = {};
  const productRevenue: Record<string, number> = {};
  const variantSales: Record<string, number> = {};
  let totalStoreRevenue = 0;
  const uniqueOrderIds = new Set<string>();

  if (store) {
    // 1. Fetch products
    const { data: productsData } = await supabase
      .from("products")
      .select("*, price_options(*), product_images(*)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });

    if (productsData) {
      myProducts = productsData;
    }

    // 2. Fetch order items for sales calculations
    const { data: storeOrderItems } = await supabase
      .from("order_items")
      .select(`
        id,
        quantity,
        price,
        product_id,
        selected_variant_id,
        orders!inner (
          id,
          status,
          store_id,
          total_amount,
          shipping_cost,
          shipping_method,
          cancel_reason
        )
      `)
      .eq("orders.store_id", store.id)
      .in("orders.status", ["Diproses", "Dikirim", "Selesai", "Proses Pembatalan"]);

    if (storeOrderItems) {
      const uniqueOrders = new Map<string, { total_amount: number; shipping_cost: number; shipping_method: string | null; status: string; cancel_reason: string | null }>();
      const orderItemsByOrderId = new Map<string, any[]>();

      storeOrderItems.forEach((item: any) => {
        const o = item.orders;
        let deadQty = 0;
        if (o?.status === "Proses Pembatalan" && o.cancel_reason?.startsWith("JSON_DATA:")) {
          try {
            const deadItems = JSON.parse(o.cancel_reason.substring(10));
            deadQty = deadItems[item.id] || 0;
          } catch (e) {
            console.error("Failed to parse cancel_reason JSON on products item parse:", e);
          }
        }

        const qty = Math.max(0, (item.quantity || 0) - deadQty);
        const price = item.price || 0;
        const revenue = qty * price;
        
        const pId = item.product_id;
        productSales[pId] = (productSales[pId] || 0) + qty;
        productRevenue[pId] = (productRevenue[pId] || 0) + revenue;

        if (item.selected_variant_id) {
          const vId = item.selected_variant_id;
          variantSales[vId] = (variantSales[vId] || 0) + qty;
        }

        if (o) {
          if (!uniqueOrders.has(o.id)) {
            uniqueOrders.set(o.id, {
              total_amount: o.total_amount || 0,
              shipping_cost: o.shipping_cost || 0,
              shipping_method: o.shipping_method,
              status: o.status,
              cancel_reason: o.cancel_reason
            });
            uniqueOrderIds.add(o.id);
          }
          if (!orderItemsByOrderId.has(o.id)) {
            orderItemsByOrderId.set(o.id, []);
          }
          orderItemsByOrderId.get(o.id)!.push({
            id: item.id,
            price: item.price || 0,
            quantity: item.quantity || 0
          });
        }
      });

      uniqueOrders.forEach((o, orderId) => {
        let currentTotal = o.total_amount;
        if (o.status === "Proses Pembatalan" && o.cancel_reason?.startsWith("JSON_DATA:")) {
          try {
            const deadItems = JSON.parse(o.cancel_reason.substring(10));
            let refundTotal = 0;
            const items = orderItemsByOrderId.get(orderId) || [];
            items.forEach((item) => {
              const deadQty = deadItems[item.id];
              if (deadQty) {
                refundTotal += deadQty * item.price;
              }
            });
            currentTotal = Math.max(0, currentTotal - refundTotal);
          } catch (e) {
            console.error("Failed to parse cancel_reason JSON on products page calculation:", e);
          }
        }
        const netAmount = Math.max(0, currentTotal - 5000);
        const shippingAdd = o.shipping_method === "penjual" ? (o.shipping_cost || 0) : 0;
        totalStoreRevenue += netAmount + shippingAdd;
      });
    }
  }

  let bestSellingProduct = "Belum ada penjualan";
  let maxSoldQty = 0;
  myProducts.forEach((p) => {
    const soldQty = productSales[p.id] || 0;
    if (soldQty > maxSoldQty) {
      maxSoldQty = soldQty;
      bestSellingProduct = p.name;
    }
  });

  const searchQuery = (searchParams.q || "").toLowerCase().trim();
  const filteredProducts = searchQuery
    ? myProducts.filter((p) => p.name?.toLowerCase().includes(searchQuery))
    : myProducts;

  async function deleteProduct(formData: FormData) {
    "use server";
    const productId = formData.get("productId") as string;
    if (!productId) return;
    const supabaseAdmin = createClient(cookies());
    // Hapus opsi harga dulu (atau andalkan CASCADE di supabase)
    await supabaseAdmin.from("price_options").delete().eq("product_id", productId);
    await supabaseAdmin.from("products").delete().eq("id", productId);
    revalidatePath("/dashboard/products");
  }

  return (
    <div>
      <Navbar />
      <Container>
        <div className="max-w-6xl mx-auto relative min-h-screen">
          <div className="relative z-10">
            {/* HEADER */}
            <div className="mb-6">
              <BackButton href="/dashboard" />
              <h1 className="text-2xl font-bold text-gray-800 mt-1">
                Produk Saya
              </h1>
            </div>

            {/* MAIN GRID */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* LEFT: PRODUCT LIST */}
              <div className="md:col-span-2 space-y-4">

                {/* Search bar */}
                <Suspense fallback={null}>
                  <ProductSearchBar defaultValue={searchParams.q} />
                </Suspense>

                {/* Result count */}
                {searchQuery && (
                  <p className="text-sm text-gray-500">
                    {filteredProducts.length === 0
                      ? `Tidak ada produk untuk "${searchParams.q}"`
                      : `${filteredProducts.length} produk ditemukan untuk "${searchParams.q}"`}
                  </p>
                )}

                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="card p-4 flex gap-4 items-start"
                  >
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                      <Image
                        src={
                          (Array.isArray(product.product_images) && product.product_images.length > 0)
                            ? [...product.product_images].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))[0]?.url
                            : (product.gambar || "/images/default.png")
                        }
                        alt={product.name || "product"}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>

                    {/* CONTENT */}
                    <div className="flex-1">
                      <h2 className="font-semibold text-gray-800">
                        {product.name}
                      </h2>
                      <p className="text-sm text-gray-400 mt-1 line-clamp-3">
                        {product.description || "Deskripsi produk..."}
                      </p>

                       {/* PRICE */}
                      {product.type === 0 ? (
                        <p className="text-lg font-bold text-primary mt-2">
                          {formatPrice(product.price)}{" "}
                          <span className="text-sm font-normal text-gray-400">
                            /{product.unit}
                          </span>
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                          {(product.price_options || []).map((opt: any) => {
                            const sold = variantSales[opt.id] || 0;

                            return (
                              <div
                                key={opt.label}
                                className="border border-gray-200 rounded-xl px-4 py-3"
                              >
                                <p className="text-sm text-gray-500">
                                  {opt.label}
                                </p>

                                <p className="text-lg font-bold text-gray-800">
                                  {formatPrice(opt.price)}
                                </p>

                                <p className="text-xs text-gray-400 mt-1">
                                  Terjual {sold}
                                </p>

                                <p className="text-xs text-gray-400">
                                  Total pendapatan{" "}
                                  {formatPrice(opt.price * sold)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* INFO BADGES */}
                      <div className="flex gap-2 mt-2 flex-wrap text-xs items-center">
                        {/* STOK */}
                        <span className="px-2 py-1 rounded font-bold bg-[#407BB5] text-white">
                          Stok
                        </span>

                        <span className="px-2 py-1 rounded bg-[#407BB5] text-white">
                          {product.type === 0
                            ? `${product.stock || 0} ${product.unit || 'unit'}`
                            : `${(product.price_options || []).reduce((sum: number, p: any) => sum + (p.stock || 0), 0)} unit`}
                        </span>

                        {/* TERJUAL */}
                        <span className="px-2 py-1 rounded font-bold bg-[#5b99d7] text-white">
                          Terjual
                        </span>

                        <span className="px-2 py-1 rounded bg-[#5b99d7] text-white">
                          {productSales[product.id] || 0} {product.type === 0 ? (product.unit || "unit") : "unit"}
                        </span>

                        {/* TOTAL PENDAPATAN */}
                        <span className="px-2 py-1 rounded font-bold bg-[#7db5ed] text-white">
                          Total Pendapatan
                        </span>

                        <span className="px-2 py-1 rounded bg-[#7db5ed] text-white">
                          {formatPrice(productRevenue[product.id] || 0)}
                        </span>
                      </div>

                      {/* ACTION */}
                      <div className="flex justify-end mt-2 gap-3">
                        <Link
                          href={`/dashboard/products/${product.id}/edit`}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary"
                        >
                          <Pencil size={12} />
                          Edit
                        </Link>
                        <form action={deleteProduct}>
                          <input type="hidden" name="productId" value={product.id} />
                          <DeleteProductButton />
                        </form>
                      </div>
                    </div>

                    {/* ACTION */}
                  </div>
                ))}

                {/* Empty state */}
                {filteredProducts.length === 0 && !searchQuery && (
                  <div className="card p-12 text-center text-gray-400 text-sm">
                    Belum ada produk. Tambahkan produk pertama Anda!
                  </div>
                )}
              </div>

              {/* RIGHT: SUMMARY */}
              <div className="space-y-4 sticky top-24 self-start">
                {/* REKAP CARD */}
                <div className="card p-5">
                  <h2 className="font-bold text-gray-800 mb-4">
                    Rekap Penjualan Produk
                  </h2>

                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Pemasukan</span>
                      <span className="font-semibold">{formatPrice(totalStoreRevenue)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Order</span>
                      <span className="font-semibold">{uniqueOrderIds.size}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Produk Paling Laris</span>
                      <span className="font-semibold text-primary text-right">
                        {bestSellingProduct}
                      </span>
                    </div>
                  </div>
                </div>

                <Link href="/dashboard/products/add" className="w-full btn-primary py-3 text-sm flex justify-center items-center">
                  + Tambahkan Produk
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
