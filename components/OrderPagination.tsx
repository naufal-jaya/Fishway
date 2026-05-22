"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function OrderPagination({ total, perPage }: { total: number; perPage: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page") || 1);
  const totalPages = Math.ceil(total / perPage);

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/seller/orders?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="px-5 py-4 flex items-center justify-between border-t">
      <p className="text-xs text-gray-400">
        Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, total)} of {total} orders
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`w-8 h-8 text-sm rounded-lg transition-colors ${
              currentPage === page
                ? "bg-primary text-white font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}