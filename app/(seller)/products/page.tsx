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

export default async function SellerProductsPage() {
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
  
  if (store) {
    const { data } = await supabase
      .from("products")
      .select("*, price_options(*)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });
      
    if (data) {
      myProducts = data;
    }
  }

  async function deleteProduct(formData: FormData) {
    "use server";
    const productId = formData.get("productId") as string;
    if (!productId) return;
    const supabaseAdmin = createClient(cookies());
    // Hapus opsi harga dulu (atau andalkan CASCADE di supabase)
    await supabaseAdmin.from("price_options").delete().eq("product_id", productId);
    await supabaseAdmin.from("products").delete().eq("id", productId);
    revalidatePath("/products");
  }

  return (
    <div>
      <Navbar />
      <Container>
        <div className="max-w-6xl mx-auto relative min-h-screen">
          <div
            className="fixed top-0 left-0 h-full pointer-events-none z-0"
            style={{
              backgroundImage: "url('/images/latar.png')",
              backgroundRepeat: "no-repeat",
              backgroundSize: "contain",
              backgroundPosition: "left center",
              width: "1300px",
              opacity: 1,
            }}
          />

          <div className="relative z-10">
            {/* HEADER */}
            <div className="mb-6">
            <Link href="/seller" className="inline-flex items-center text-gray-400 hover:text-[#407BB5]">
              <ChevronLeft className="w-5 h-5" />
            </Link>
              <h1 className="text-2xl font-bold text-gray-800 mt-1">
                Produk Gua
              </h1>
            </div>

            {/* MAIN GRID */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* LEFT: PRODUCT LIST */}
              <div className="md:col-span-2 space-y-4">
                {myProducts.map((product) => (
                  <div
                    key={product.id}
                    className="card p-4 flex gap-4 items-start"
                  >
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                      <Image
                        src={product.gambar || "/images/default.png"}
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
                      <p className="text-sm text-gray-400 mt-1">
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
                            const sold = 0; // sementara dummy kalau belum ada data

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
                          5 {product.type === 0 ? product.unit : "unit"}
                        </span>

                        {/* TOTAL PENDAPATAN */}
                        <span className="px-2 py-1 rounded font-bold bg-[#7db5ed] text-white">
                          Total Pendapatan
                        </span>

                        <span className="px-2 py-1 rounded bg-[#7db5ed] text-white">
                          Rp75.000
                        </span>
                      </div>

                      {/* ACTION */}
                      <div className="flex justify-end mt-2 gap-3">
                        <Link 
                          href={`/products/${product.id}/edit`}
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
              </div>

              {/* RIGHT: SUMMARY */}
              <div className="space-y-4">
                {/* REKAP CARD */}
                <div className="card p-5">
                  <h2 className="font-bold text-gray-800 mb-4">
                    Rekap Penjualan Produk
                  </h2>

                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Pemasukan</span>
                      <span className="font-semibold">Rp1.400.000</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Order</span>
                      <span className="font-semibold">23</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Produk Paling Laris</span>
                      <span className="font-semibold text-primary text-right">
                        Ikan Lele Asli Magetan
                      </span>
                    </div>
                  </div>
                </div>

                <Link href="/products/add" className="w-full btn-primary py-3 text-sm flex justify-center items-center">
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
