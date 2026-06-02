"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

const STATUS_TABS = ["Semua", "Menunggu Pembayaran", "Menunggu Konfirmasi", "Diproses", "Dikirim", "Selesai", "Dibatalkan"];
const DATE_OPTIONS = [
  { label: "Semua Tanggal", value: "" },
  { label: "Hari ini", value: "today" },
  { label: "7 hari terakhir", value: "week" },
  { label: "30 hari terakhir", value: "month" },
];

export default function OrderFilterBar({ currentStatus, currentDate }: { currentStatus: string; currentDate: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/orders?${params.toString()}`);
    setOpen(false);
  };

  const hasFilter = currentStatus !== "Semua" || currentDate !== "";

  return (
    <div className="flex items-center gap-2 relative z-50">
      {/* Active filter chips */}
      {currentStatus !== "Semua" && (
        <span className="hidden md:flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">

          {currentStatus}
          <button onClick={() => setFilter("status", "")} className="ml-1 hover:text-red-400">×</button>
        </span>
      )}
      {currentDate && (
        <span className="hidden md:flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
          {DATE_OPTIONS.find(d => d.value === currentDate)?.label}
          <button onClick={() => setFilter("date", "")} className="ml-1 hover:text-red-400">×</button>
        </span>
      )}
      {!hasFilter && (
        <span className="hidden md:inline text-xs text-gray-400">Belum ada filter aktif</span>
      )}

      {/* Filter button */}
      <button
        onClick={() => setOpen(!open)}
        className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors font-medium ${hasFilter ? "border-primary text-primary" : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"}`}
      >
        <SlidersHorizontal size={14} />
        <span className="hidden md:inline">Filter</span>
        {hasFilter && "•"}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-10 bg-white border border-gray-100 rounded-xl shadow-xl z-50 w-64 p-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Status</p>
            <div className="flex flex-col gap-1 mb-3">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter("status", tab === "Semua" ? "" : tab)}
                  className={`text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors ${currentStatus === tab ? "text-primary font-medium bg-primary/5" : "text-gray-600"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tanggal</p>
            <div className="flex flex-col gap-1">
              {DATE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter("date", opt.value)}
                  className={`text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors ${currentDate === opt.value ? "text-primary font-medium bg-primary/5" : "text-gray-600"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}