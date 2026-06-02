import Container from "@/components/Container";
import ProductCard from "@/components/ProductCard";
import { Product, PRODUCT_CATEGORIES } from "@/lib/data";
import Navbar from "@/components/Navbar";
import CategoryFilter from "@/components/CategoryFilter";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { Hand } from "lucide-react";
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
    <div className="relative min-h-screen bg-white overflow-x-hidden">
      {/* Hide the global layout footer on this page */}
      <style dangerouslySetInnerHTML={{ __html: `footer { display: none !important; }` }} />

      {/* Background Latar */}
      <div
        className="fixed top-0 left-0 h-full pointer-events-none z-0 w-full max-w-[1300px]"
        style={{
          backgroundImage: "url('/images/latar.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          backgroundPosition: "left center",
          opacity: 1,
        }}
      />

      {/* Main Wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen w-full">
        <Navbar />
        <Container className="flex-grow">
          {/* Welcoming Header */}
          <h1 className="text-xl sm:text-4xl font-bold my-6 sm:my-8 flex flex-wrap items-center gap-2 text-gray-800">
            Selamat Datang di Fishway, {displayName}
            <Hand className="text-yellow-500 animate-bounce shrink-0 w-6 h-6 sm:w-8 sm:h-8" />
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

      {/* Fixed Sticky Waves at the bottom of the viewport, layered behind content (z-[5]) but in front of background (z-0) */}
      <div className="fixed bottom-0 left-0 w-full h-24 sm:h-40 pointer-events-none z-[5] overflow-hidden">
        <svg
          className="absolute bottom-0 left-0 w-full z-0 h-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            d="M0.000942231 37.2993C0.000942231 37.2993 113.811 -42.2906 166.552 73.4664C219.293 189.223 310.822 105.64 400.046 118.997C489.27 132.353 510.174 197.15 613.941 172.5C730.392 144.837 741.455 276.583 861.631 198.5C962.441 133 1001.02 211.058 1101.94 198.5C1201.03 186.17 1216.93 115.986 1324.94 172.5C1432.95 229.014 1445.94 -6.95959e-05 1523.26 0C1536.06 248.051 1524.08 261.374 1523.26 420C1523.26 420 -0.00114292 865.966 6.43158e-10 394.983C0.00114292 -76.0001 0.739034 205.986 0.000766754 88L0.000942231 37.2993Z"
            fill="#A2D2FF"
            fillOpacity="0.4"
          />
        </svg>

        <svg
          className="absolute -bottom-6 sm:-bottom-10 left-0 w-full z-10 h-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            d="M0.000175476 37.2993C0.000175476 37.2993 0.458678 36.9786 1.33097 36.4076C1.50784 23.4542 1.66758 18.8862 1.79234 36.1075C16.4791 26.6079 117.706 -33.7407 166.551 73.4664C219.293 189.223 310.822 105.64 400.046 118.997C489.269 132.353 510.173 197.15 613.941 172.5C746.545 118.997 813.15 115.182 1004.05 188.841C1097.21 224.788 1193.53 116.326 1301.55 172.841C1409.56 229.355 1445.94 -6.95959e-05 1523.26 0C1536.06 248.051 1525.37 175.214 1525.32 252.925C1489.5 297.14 338.341 292.79 2.06249 252.925C2.06281 120.752 1.95866 59.0663 1.79234 36.1075C1.62759 36.214 1.47374 36.3142 1.33097 36.4076C0.903387 67.7215 0.37568 148.039 0 88L0.000175476 37.2993Z"
            fill="#A2D2FF"
            fillOpacity="0.5"
          />
        </svg>

        <svg
          className="absolute -bottom-12 sm:-bottom-24 left-0 w-full z-20 h-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            d="M0.000175476 9.72022C0.000175476 9.72022 130.14 -31.7798 226.14 56.7202C322.14 145.22 442.416 53.3636 531.64 66.7202C620.863 80.0768 667.372 135.87 771.14 111.22C903.744 57.7167 885.744 48.061 1076.64 121.72C1169.8 157.667 1193.53 73.312 1301.55 129.826C1409.56 186.341 1454.83 46.7201 1532.15 46.7202C1532.15 140.001 1532.16 158.393 1532.16 160.017C1532.17 152.921 1532.17 161.242 1532.16 160.017C1532.16 163.428 1532.15 170.404 1532.15 183.72H3.20655C3.20606 145.826 0.738267 230.206 0 112.22L0.000175476 9.72022Z"
            fill="#689DD1"
          />
        </svg>
      </div>
    </div>
  );
}
