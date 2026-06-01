import Container from "@/components/Container";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/lib/data";
import Navbar from "@/components/Navbar";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q || "";
  const supabase = createClient(cookies());

  let dbQuery = supabase
    .from("products")
    .select("*, stores(name, phone), price_options(*), product_images(*)")
    .order("created_at", { ascending: false });

  if (query) {
    dbQuery = dbQuery.ilike("name", `%${query}%`);
  }

  const { data: rawProducts, error } = await dbQuery;

  if (error) {
    console.error("Supabase error fetching products for search:", error);
  }

  const products: Product[] = (rawProducts || []).map((p: any) => {
    const base = {
      id: p.id,
      name: p.name,
      category: p.category || "",
      seller: (Array.isArray(p.stores) ? p.stores[0]?.name : p.stores?.name) || "Penjual",
      location: p.location || "Lokasi tidak diketahui",
      description: p.description || "",
      gambar: (Array.isArray(p.product_images) && p.product_images.length > 0) 
        ? [...p.product_images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0]?.url 
        : (p.gambar || "/images/default.png"),
      jenis: p.jenis || "",
      condition: p.condition || "",
      origin: p.origin || "",
      food: p.food || "",
      image: p.image || "/images/default.png",
    };

    if (p.type === 1) {
      return {
        ...base,
        type: 1,
        priceOptions: p.price_options || [],
      } as Product;
    }

    return {
      ...base,
      type: 0,
      price: p.price || 0,
      unit: p.unit || "unit",
      stock: p.stock || 0,
    } as Product;
  });

  return (
    <div>
      <Navbar />
      <Container>
        <div className="py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Hasil Pencarian: <span className="text-primary">"{query}"</span>
            </h1>
            <span className="text-sm text-gray-500">
              {products.length} produk ditemukan
            </span>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 card">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Produk Tidak Ditemukan
              </h2>
              <p className="text-gray-500 mb-6">
                Coba gunakan kata kunci lain atau periksa ejaan Anda.
              </p>
              <Link href="/" className="btn-primary inline-block">
                Kembali ke Beranda
              </Link>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
