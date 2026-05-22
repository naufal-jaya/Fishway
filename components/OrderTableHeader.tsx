"use client";

import { Suspense } from "react";
import OrderSearchBar from "./OrderSearchBar";
import OrderFilterBar from "./OrderFilterBar";

export default function OrderTableHeader({ currentStatus, currentDate }: { currentStatus: string; currentDate: string }) {
  return (
    <>
        <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b">
        <h2 className="font-bold text-gray-800 text-lg">Recent Orders</h2>
        <div className="flex items-center gap-2">
            <Suspense fallback={null}>
            <OrderSearchBar />
            </Suspense>
            <Suspense fallback={null}>
            <OrderFilterBar currentStatus={currentStatus} currentDate={currentDate} />
            </Suspense>
        </div>
        </div>
    </>
  );
}