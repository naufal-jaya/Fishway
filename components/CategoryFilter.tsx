"use client";

import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import { Product, PRODUCT_CATEGORIES } from "@/lib/data";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CATEGORIES = [
  "Semua",
  ...PRODUCT_CATEGORIES,
];

const ITEMS_PER_PAGE = 10;

export default function CategoryFilter({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered =
    selected === "Semua"
      ? products
      : products.filter(
          (p) => p.category?.toLowerCase() === selected.toLowerCase()
        );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedProducts = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSelectCategory = (cat: string) => {
    setSelected(cat);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const element = document.getElementById("katalog-produk-title");
    if (element) {
      // Offset slightly to account for the sticky navbar height
      const yOffset = -80; 
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2 px-0 mb-2 mt-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleSelectCategory(cat)}
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
        {paginatedProducts.length === 0 ? (
          <p className="text-gray-500 text-sm col-span-full text-center py-8">
            Tidak ada produk di kategori ini.
          </p>
        ) : (
          paginatedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-8 mb-4 relative z-30">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl border border-gray-300 text-gray-600 hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-gray-600 transition-colors bg-white shadow-sm cursor-pointer"
            aria-label="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, idx) => {
            const pageNum = idx + 1;
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-9 h-9 rounded-xl text-sm font-semibold border transition-all duration-200 shadow-sm cursor-pointer ${
                  currentPage === pageNum
                    ? "bg-[#407BB5] text-white border-[#407BB5] scale-105"
                    : "border-gray-300 text-gray-600 bg-white hover:border-primary hover:text-primary"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl border border-gray-300 text-gray-600 hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-gray-600 transition-colors bg-white shadow-sm cursor-pointer"
            aria-label="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </>
  );
}