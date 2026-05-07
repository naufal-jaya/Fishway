import Container from "@/components/Container";
import ProductGallery from "@/components/ProductGallery";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { MapPin } from "lucide-react";

const WA_NUMBER = "6281234567890";

type PriceOption = {
  label: string;
  price: number;
  stock: number;
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
  stores?: { name: string; phone: string } | null;
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
    .select("*, stores(name, phone), price_options(*)")
    .eq("id", params.id)
    .maybeSingle<ProductRow>();

  if (error || !product) {
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
  const waNumber = product.stores?.phone || WA_NUMBER;
  const waLink = `https://wa.me/${waNumber}?text=Halo, saya tertarik dengan ${product.name}`;

  return (
    <div className="min-h-screen bg-gray-50">

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
<Navbar />
      <Container>
        <div className="max-w-5xl mx-auto py-6 relative z-10">
        
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
              <div className="md:w-1/2">
                  <ProductGallery
                    mainImage={product.gambar || "/images/default.png"}
                    extraImages={[product.image, product.gambar].filter(Boolean) as string[]}
                    name={product.name}
                  />
              </div>
              
              

              {/* Right: Info + Actions */}
              <div className="md:w-1/2 p-6 border-t md:border-t-0 md:border-l border-gray-100">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[1,2,3,4,5].map((s) => (
                      <svg key={s} className={`w-4 h-4 ${s <= 3 ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">5 Reviews</span>
                </div>

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
                />
              </div>
            </div>
          </div>

          {/* Bottom: Tab Info */}
          <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Tab bar — static, Info Produk always shown */}
            <div className="flex border-b border-gray-100">
              {["Info Produk", "Ulasan (3)", "Rekomendasi"].map((tab, i) => (
                <button
                  key={tab}
                  className={`px-6 py-3.5 text-sm font-medium transition-colors ${
                    i === 0
                      ? "border-b-2 border-[#407BB5] text-[#407BB5]"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-6">
              {/* Deskripsi */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Deskripsi Produk</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
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

              {/* Packaging */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Pengiriman &amp; Packaging</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {packaging.map((p) => (
                    <div key={p.label} className="flex items-start gap-2.5 bg-gray-50 rounded-xl p-3">
                      <span className="flex-shrink-0 mt-0.5">{p.icon}</span>
                      <p className="text-sm text-gray-600 leading-snug">{p.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </Container>
      </div>
      
    </div>
  );
}