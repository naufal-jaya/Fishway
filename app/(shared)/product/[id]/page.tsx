import Container from "@/components/Container";
import ProductGallery from "@/components/ProductGallery";
import ProductActions from "@/components/ProductActions";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  Globe,
  Truck,
  FishSymbol,
  HandPlatter,
  Store,
  MapPin,
} from "lucide-react";

const WA_NUMBER = "6281234567890";

type PriceOption = {
  label: string;
  price: number;
  stock: number;
};

type ProductImage = {
  url: string;
  caption: string | null;
  sort_order: number;
};

type ProductRow = {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  condition: string | null;
  origin: string | null;
  category: string | null;
  location: string | null;
  price: number | null;
  unit: string | null;
  stock: number | null;
  type: number;
  gambar: string | null;
  jenis: string | null;
  food: string | null;
  image: string | null;
  suhu_ideal?: string | null;
  ph_ideal?: string | null;
  price_options?: PriceOption[] | string | null;
  product_images?: ProductImage[] | null;
  stores?: { name: string; phone: string; address?: string | null; location?: string | null; lat?: number | null; lon?: number | null; max_distance?: number | null } | null;
};

function normalizePriceOptions(value: unknown): PriceOption[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is PriceOption =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as any).label === "string" &&
        typeof (item as any).price === "number" &&
        typeof (item as any).stock === "number"
    );
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is PriceOption =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as any).label === "string" &&
            typeof (item as any).price === "number" &&
            typeof (item as any).stock === "number"
        );
      }
    } catch {
      return [];
    }
  }
  return [];
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient(cookies());
  const { data: product, error } = await supabase
    .from("products")
    .select("*, stores(*), price_options(*), product_images(*)")
    .eq("id", params.id)
    .maybeSingle<ProductRow>();

  if (error || !product) {
    if (error) console.error("Error fetching product:", error);
    notFound();
  }

  const priceOptions = normalizePriceOptions(product.price_options);
  const hasVariants = priceOptions.length > 0;
  const minPrice = hasVariants
    ? Math.min(...priceOptions.map((opt) => opt.price))
    : (product.price ?? 0);
  const maxPrice = hasVariants
    ? Math.max(...priceOptions.map((opt) => opt.price))
    : (product.price ?? 0);
  const totalStock = hasVariants
    ? priceOptions.reduce((sum, option) => sum + option.stock, 0)
    : (product.stock ?? 0);
  const sellerName = product.stores?.name || "Penjual";
  const maxDistanceLimit = product.stores?.max_distance != null ? product.stores.max_distance : 10;
  const waNumber = product.stores?.phone || WA_NUMBER;
  const waLink = `https://wa.me/${waNumber}?text=Halo, saya tertarik dengan ${product.name}`;
  const galleryImages = Array.isArray(product.product_images) && product.product_images.length > 0
    ? [...product.product_images]
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((image) => ({ url: image.url, caption: image.caption }))
    : [{ url: product.gambar || "/images/default.png", caption: null }];
  const trimCat = product.category ? product.category.trim() : "";
  const categoryNormalized = (trimCat === "Ikan Tangkapan Laut" || trimCat === "Ikan Air Laut" || trimCat === "Ikan Laut") ? "Ikan Air Asin" : (trimCat === "Ikan Ternak" ? "Ikan Air Tawar" : (trimCat === "Olahan Ikan" ? "Produk Olahan" : trimCat));
  const attrs = [
    { icon: <Activity className="w-4 h-4" />, label: "Kondisi", value: product.condition },
    { icon: <Globe className="w-4 h-4" />, label: "Asal", value: product.origin },
    { icon: <FishSymbol className="w-4 h-4" />, label: "Pakan", value: product.food },
  ].filter((a) => a.value);



  let userDistance: number | null = null;
  const { data: { user } } = await supabase.auth.getUser();
  if (user && product.stores?.lat && product.stores?.lon) {
    const { data: address } = await supabase
      .from("addresses")
      .select("lat, lon")
      .eq("user_id", user.id)
      .eq("is_primary", true)
      .maybeSingle();

    if (address?.lat && address?.lon) {
      const { calculateDistance } = await import("@/lib/distance");
      userDistance = calculateDistance(product.stores.lat, product.stores.lon, address.lat, address.lon);
    }
  }

  const isOutOfRange = userDistance !== null && userDistance > maxDistanceLimit;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="relative z-10">
        <Navbar />
        <Container>
          <div className="max-w-6xl mx-auto py-6 relative z-10">

            {/* Breadcrumb */}
            <Link href="/" className="inline-flex items-center text-gray-400 hover:text-[#407BB5] mb-4">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <nav className="flex items-center gap-1 text-sm text-gray-400 mb-5">
              <Link href="/" className="hover:text-[#407BB5] transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/" className="hover:text-[#407BB5] transition-colors">Produk</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-700 font-medium">{product.name}</span>
            </nav>

            {/* Main Card */}
            <div className="bg-transparent border-none shadow-none overflow-visible">
              <div className="flex flex-col md:flex-row gap-6">

                {/* Gallery — handled client side */}
                <div className="w-full md:w-1/2">
                  <ProductGallery
                    mainImage={product.gambar || "/images/default.png"}
                    images={galleryImages}
                    name={product.name}
                  />
                </div>



                {/* Right: Info + Actions */}
                <div className="w-full md:w-1/2 p-4 md:p-6 border-t md:border-t-0 md:border-l border-gray-100">
                  <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 break-words">{product.name}</h1>



                  <ProductActions
                    product={{
                      id: product.id,
                      name: product.name,
                      type: product.type,
                      price: product.price,
                      unit: product.unit,
                      stock: product.stock,
                    }}
                    priceOptions={priceOptions}
                    waNumber={waNumber}
                    sellerName={sellerName}
                    storeId={product.store_id}
                    isOutOfRange={isOutOfRange}
                  />
                </div>
              </div>
            </div>

            {/* Store Info */}
            <div className="bg-white rounded-2xl width-auto border border-gray-100 shadow-sm p-4 sm:p-6 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <Store className="w-8 h-8  text-[#407BB5] self-center" />
              <div className="flex-1 text-center sm:text-left">
                <Link href={`/store/${product.store_id}`} className="text-xl font-bold text-gray-900 hover:text-[#407BB5] transition-colors">
                  {sellerName}
                </Link>
                {(product.stores?.address || product.stores?.location) && (
                  <div className="flex items-center justify-start gap-1.5 text-gray-500 mt-2 text-sm">
                    <MapPin className="w-6 h-6 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="text-left">{product.stores.address || product.stores.location}</span>
                  </div>
                )}
                {userDistance !== null && (
                  <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${isOutOfRange ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                    <Truck className="w-4 h-4" />
                    Jarak ke alamat Anda: {userDistance.toFixed(1)} km
                    {isOutOfRange && " (Luar Jangkauan)"}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom: Tab Info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">


              <div className="p-6 space-y-6">
                {/* Deskripsi */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Deskripsi Produk</h3>
                  <p className="text-sm text-gray-500 leading-relaxed break-words">
                    {product.description || "Produk segar berkualitas, dibudidayakan secara higienis."}
                  </p>
                </div>

                {/* Attributes */}
                <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                  {attrs.map((a) => (
                    <div key={a.label} className="flex items-start gap-2.5 bg-gray-50 rounded-xl p-3">
                      <span className="text-black-500 mt-0.5 flex-shrink-0">{a.icon}</span>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{a.label}</p>
                        <p className="text-sm font-medium text-gray-800">{a.value}</p>
                      </div>
                    </div>
                  ))}
                </div>


              </div>
            </div>

          </div>
        </Container>
      </div>

    </div>
  );
}
