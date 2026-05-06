import Container from "@/components/Container";
import { formatPrice, PriceOption } from "@/lib/data";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { MapPin } from "lucide-react";

const WA_NUMBER = "6281234567890"; // Ganti nomor WA penjual

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
  price_options?: PriceOption[] | string | null;
  stores?: {
    name: string;
    phone: string;
  } | null;
};

function normalizePriceOptions(value: unknown): PriceOption[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is PriceOption =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as any).label === "string" &&
        typeof (item as any).price === "number" &&
        typeof (item as any).stock === "number",
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
            typeof (item as any).stock === "number",
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
    .select("*, stores(name, phone)")
    .eq("id", params.id)
    .maybeSingle<ProductRow>();

  if (error || !product) {
    console.error(error ?? "Product not found");
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
    <div>
      <Navbar />
      <Container>
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-800">{product.name}</span>
          </nav>

          <div className="card overflow-hidden md:flex">
            {/* Product Image */}
            <div className="bg-blue-50 md:w-72 h-56 md:h-auto flex items-center justify-center text-8xl flex-shrink-0">
              <span>{(product as any).emoji || "🐟"}</span>
            </div>

            {/* Product Info */}
            <div className="p-6 flex-1 space-y-4">
              <div>
                <span className="text-xs bg-blue-100 text-primary px-2 py-0.5 rounded-full font-medium">
                  {product.category}
                </span>

                <h1 className="text-2xl font-bold text-gray-800 mt-2">
                  {product.name}
                </h1>
              </div>

              {/* PRICE (SAFE FOR TYPE 0/1) */}
              <div>
                {hasVariants ? (
                  <>
                    <p className="text-3xl font-bold text-primary">
                      {formatPrice(minPrice)} - {formatPrice(maxPrice)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {priceOptions.length} varian tersedia
                    </p>

                    <div className="space-y-2 mt-3">
                      <p className="text-xs text-gray-400">Varian tersedia:</p>

                      <div className="space-y-2">
                        {priceOptions.map((opt) => (
                          <div
                            key={opt.label}
                            className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                          >
                            <span className="text-sm text-gray-700">
                              {opt.label}
                            </span>

                            <div className="text-right">
                              <p className="text-sm font-semibold text-primary">
                                {formatPrice(opt.price)}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                Stok: {opt.stock}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-3xl font-bold text-primary">
                    {formatPrice(product.price ?? 0)}
                    {product.unit ? (
                      <span className="text-lg font-normal text-gray-400">
                        /{product.unit}
                      </span>
                    ) : null}
                  </p>
                )}
              </div>

              <div className="grid gap-2 text-gray-600 text-sm leading-relaxed">
                {product.description ? <p>{product.description}</p> : null}
                {product.condition ? (
                  <p>
                    <span className="font-semibold text-gray-800">
                      Kondisi:
                    </span>{" "}
                    {product.condition}
                  </p>
                ) : null}
                {product.origin ? (
                  <p>
                    <span className="font-semibold text-gray-800">Asal:</span>{" "}
                    {product.origin}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {/* SELLER */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-0.5">Penjual</p>
                  <p className="font-semibold text-gray-800">{sellerName}</p>
                </div>

                {/* LOCATION */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-0.5">Lokasi</p>
                  <p className="font-semibold text-gray-800 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    {product.location || "-"}
                  </p>
                </div>

                {/* STOCK */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-0.5">Stok</p>
                  <p className="font-semibold text-gray-800">
                    {totalStock}{" "}
                    {hasVariants ? "unit" : (product.unit ?? "unit")}
                  </p>
                </div>

                {/* UNIT */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-0.5">Satuan</p>
                  <p className="font-semibold text-gray-800">
                    {hasVariants
                      ? "Bervariasi"
                      : product.unit
                        ? `Per ${product.unit}`
                        : "Unit"}
                  </p>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 pt-2">
                <Link
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 btn-primary text-center py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  <span>💬</span> Hubungi Penjual
                </Link>

                <Link
                  href="/cart"
                  className="flex-1 btn-outline text-center py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  <span>🛒</span> Tambah Keranjang
                </Link>
              </div>
            </div>
          </div>

          {/* Related */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Produk Lainnya
            </h3>
            <Link href="/" className="text-sm text-primary hover:underline">
              Lihat semua produk →
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
