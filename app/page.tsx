import Container from "@/components/Container";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/lib/data";
import Navbar from "@/components/Navbar";
import CategoryFilter from "@/components/CategoryFilter";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

const CATEGORIES = [
  "Semua",
  "Ikan Laut",
  "Udang",
  "Cumi",
  "Kepiting",
  "Ikan Air Tawar",
];

export default async function HomePage() {
  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: account } = user
    ? await supabase
        .from("accounts")
        .select("name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const displayName = account?.name || user?.email || "Pengguna";

  const { data: rawProducts, error } = await supabase
    .from("products")
    .select("*, stores(name, phone), price_options(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error fetching products:", error);
  }

  const products: Product[] = (rawProducts || []).map((p: any) => {
    const base = {
      id: p.id,
      name: p.name,
      category: p.category || "",
      seller: (Array.isArray(p.stores) ? p.stores[0]?.name : p.stores?.name) || "Penjual",
      location: p.location || "Lokasi tidak diketahui",
      description: p.description || "",
      gambar: p.gambar || "/images/default.png",
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
        {/* Category Filter */}
        <h1 className="text-xl sm:text-4xl font-bold my-6 sm:my-8">
          Selamat Datang di Fishway
        </h1>
        {/* Section Title */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-3xl font-bold text-gray-800">Produk Terbaru</h2>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="flex items-center justify-between mb-2 mt-12">
          <h2 className="text-lg sm:text-3xl font-bold text-gray-800">Katalog Produk</h2>
          <span className="text-xs sm:text-sm text-gray-500">
            {products.length} produk
          </span>
        </div>

        <CategoryFilter products={products} />
      </Container>
    </div>
  );
}
