import Container from "@/components/Container";
import ProductCard from "@/components/ProductCard";
import { Product, PRODUCT_CATEGORIES } from "@/lib/data";
import Navbar from "@/components/Navbar";
import CategoryFilter from "@/components/CategoryFilter";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { getCityFromCoords } from "@/lib/geocoding";
import FooterSection from "@/components/FooterSection";


function normalizeCategory(category: string | null | undefined): string {
  if (!category) return "";
  const trimCat = category.trim();
  if (trimCat === "Ikan Tangkapan Laut" || trimCat === "Ikan Air Laut" || trimCat === "Ikan Laut") return "Ikan Air Asin";
  if (trimCat === "Ikan Ternak") return "Ikan Air Tawar";
  if (trimCat === "Olahan Ikan") return "Produk Olahan";
  return trimCat;
}

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
    .select("*, stores(id, name, phone, address, lat, lon), price_options(*), product_images(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error fetching products:", error);
  }

  const products: Product[] = await Promise.all(
    (rawProducts || []).map(async (p: any) => {
      const store = Array.isArray(p.stores) ? p.stores[0] : p.stores;
      const resolvedLocation = await getCityFromCoords(store?.id, store?.lat, store?.lon, store?.address);

      const base = {
        id: p.id,
        name: p.name,
        category: normalizeCategory(p.category),
        seller: store?.name || "Penjual",
        location: resolvedLocation || p.location || "Lokasi tidak diketahui",
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
    })
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Hide the global layout footer on this page */}
      <style dangerouslySetInnerHTML={{ __html: `footer { display: none !important; }` }} />

      {/* Main Wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen w-full">
        <Navbar />
        <Container className="flex-grow">
          {/* Welcoming Header */}
          <h1 className="text-xl sm:text-4xl font-bold my-6 sm:my-8 flex flex-wrap items-center gap-2 text-gray-800">
            Selamat Datang di Fishway{user ? `, ${displayName}` : ""}
          </h1>
          
          {/* Section Title */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-3xl font-bold text-gray-800">Produk Terbaru</h2>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
            {products.slice(0, 10).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="flex items-center justify-between mb-2 mt-12" id="katalog-produk-title">
            <h2 className="text-lg sm:text-3xl font-bold text-gray-800">Katalog Produk</h2>
            <span className="text-xs sm:text-sm text-gray-500">
              {products.length} produk
            </span>
          </div>

          <CategoryFilter products={products} />
        </Container>

        {/* Footer cards at the bottom of page content, scrolling normally */}
        <FooterSection />
      </div>

    </div>
  );
}
