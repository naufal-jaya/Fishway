import Container from "@/components/Container";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Product, parseSupabaseDate } from "@/lib/data";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { MapPin, Store, CalendarDays } from "lucide-react";
import { getCityFromCoords } from "@/lib/geocoding";

function normalizeCategory(category: string | null | undefined): string {
  if (!category) return "";
  const trimCat = category.trim();
  if (trimCat === "Ikan Tangkapan Laut" || trimCat === "Ikan Air Laut" || trimCat === "Ikan Laut") return "Ikan Air Asin";
  if (trimCat === "Ikan Ternak") return "Ikan Air Tawar";
  if (trimCat === "Olahan Ikan") return "Produk Olahan";
  return trimCat;
}

export default async function StorePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient(cookies());

  // Fetch Store
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (storeError || !store) {
    notFound();
  }

  // Fetch Products
  const { data: rawProducts, error: productsError } = await supabase
    .from("products")
    .select("*, stores(id, name, phone, address, lat, lon), price_options(*), product_images(*)")
    .eq("store_id", params.id)
    .order("created_at", { ascending: false });

  if (productsError) {
    console.error("Supabase error fetching products:", productsError);
  }

  const products: Product[] = await Promise.all(
    (rawProducts || []).map(async (p: any) => {
      const storeInfo = Array.isArray(p.stores) ? p.stores[0] : p.stores;
      const storeAddress = storeInfo?.address || store.address;
      const resolvedLocation = await getCityFromCoords(
        storeInfo?.id || store.id,
        storeInfo?.lat ?? store.lat,
        storeInfo?.lon ?? store.lon,
        storeAddress
      );

      const base = {
        id: p.id,
        name: p.name,
        category: normalizeCategory(p.category),
        seller: storeInfo?.name || "Penjual",
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

  const formattedDate = store.created_at
    ? parseSupabaseDate(store.created_at).toLocaleDateString("id-ID", {
        timeZone: 'Asia/Jakarta',
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "-";

  return (
    <div className="min-h-screen">
      <Navbar />
      <Container>
        {/* Store Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mt-6 mb-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center flex-shrink-0 text-[#407BB5]">
            <Store className="w-10 h-10" />
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{store.address || store.location || "-"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                <span>Bergabung sejak: {formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Store Products */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Semua Produk ({products.length})</h2>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mb-12">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500 mb-12">
              Toko ini belum memiliki produk.
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
