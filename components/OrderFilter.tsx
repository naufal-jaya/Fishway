"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/data";

const STATUS_COLOR: Record<string, string> = {
  "Menunggu Konfirmasi": "bg-gray-100 text-gray-700",
  "Diproses": "bg-yellow-100 text-yellow-700",
  "Dikirim": "bg-blue-100 text-blue-700",
  "Selesai": "bg-green-100 text-green-700",
};

const STATUSES = ["Semua", "Menunggu Konfirmasi", "Diproses", "Dikirim", "Selesai"];

export default function OrderFilter({ orders }: { orders: any[] }) {
  const [selected, setSelected] = useState("Semua");

  const filtered = selected === "Semua"
    ? orders
    : orders.filter((o) => o.status === selected);

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setSelected(status)}
            className={`px-4 py-1.5 rounded-xl text-sm whitespace-nowrap border transition-all duration-300 ${
              selected === status
                ? "bg-primary text-white border-primary"
                : "border-gray-300 text-gray-600 hover:border-primary hover:text-primary"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500">Tidak ada pesanan dengan status ini</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order: any) => {
            const orderDate = new Date(order.created_at).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });

            return (
              <div key={order.id} className="card p-5">
                <div className="flex justify-between items-start mb-4 border-b pb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      {orderDate} · {(Array.isArray(order.stores) ? order.stores[0]?.name : order.stores?.name) || "Toko"}
                    </p>
                    <p className="font-mono text-xs text-gray-400">ID: {order.id}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLOR[order.status] || "bg-gray-100 text-gray-700"}`}>
                    {order.status}
                  </span>
                </div>

                <div className="space-y-3">
                  {order.order_items.map((item: any) => {
                    const productInfo = Array.isArray(item.products) ? item.products[0] : item.products;
                    return (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div>
                          <span className="font-semibold text-gray-800">{productInfo?.name || "Produk"}</span>
                          <span className="text-gray-500 ml-2">x {item.quantity}</span>
                        </div>
                        <span className="text-gray-800 font-medium">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Total Belanja (termasuk ongkir)</p>
                    <p className="text-lg font-bold text-primary">{formatPrice(order.total_amount + order.shipping_cost)}</p>
                  </div>
                  <Link href={`/orders/${order.id}`} className="btn-outline px-4 py-2 text-sm rounded-xl">
                    Lihat Detail
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}