import Container from "@/components/Container";
import ProductCard from "@/components/ProductCard";
import { PRODUCTS } from "@/lib/data";
import Navbar from "@/components/Navbar";

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
  } = await supabase.auth.getUser();"/"
  const { data: account } = user
    ? await supabase
        .from("accounts")
        .select("name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const displayName = account?.name || user?.email || "Pengguna";

  return (
    <div>
      <Navbar />
      <Container>
        {/* Category Filter */}
        <h1 className="text-4xl font-bold my-8">
          Selamat Datang di Fishway, {displayName}
        </h1>
        {/* Section Title */}
        <div className="flex items-center px-4 justify-between mb-4">
          <h2 className="text-3xl font-bold text-gray-800">Produk Terbaru</h2>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 px-4 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="flex items-center px-4 justify-between mb-2 mt-12">
          <h2 className="text-3xl font-bold text-gray-800">Katalog Produk</h2>
          <span className="text-sm text-gray-500">
            {PRODUCTS.length} produk
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 px-4 mb-2 mt-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`px-4 py-1.5 rounded-xl text-sm whitespace-nowrap border transition-all duration-300 ${
                cat === "Semua"
                  ? "bg-primary text-white border-primary hover:bg-gradient-to-t hover:from-white/10 hover:to-primary"
                  : "border-gray-300 text-gray-600 hover:border-primary hover:text-primary hover:bg-gradient-to-t hover:from-primary/20 hover:to-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 px-4 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </div>
  );
}
