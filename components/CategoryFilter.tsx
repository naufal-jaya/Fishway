"use client";

import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/lib/data";

const CATEGORIES = [
  "Semua",
  "Ikan Laut",
  "Udang",
  "Cumi",
  "Kepiting",
  "Ikan Air Tawar",
];

export default function CategoryFilter({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState("Semua");

  console.log(products.map(p => p.category)); // cek di browser console
    const filtered =
        selected === "Semua"
            ? products
            : products.filter(
                (p) => p.category?.toLowerCase() === selected.toLowerCase()
            );

  return (
    <>

    <div className="flex gap-2 overflow-x-auto pb-2 px-0 mb-2 mt-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelected(cat)}
            className={`px-4 py-1.5 rounded-xl text-sm whitespace-nowrap border transition-all duration-300 ${
              selected === cat
                ? "bg-primary text-white border-primary"
                : "border-gray-300 text-gray-600 hover:border-primary hover:text-primary hover:bg-gradient-to-t hover:from-primary/20 hover:to-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm col-span-full text-center py-8">
            Tidak ada produk di kategori ini.
          </p>
        ) : (
        filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
        ))
        )}
      </div>
    </>
  );
}