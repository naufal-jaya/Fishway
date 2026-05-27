"use client";

import { useState, useEffect } from "react";
import { Package, Truck, Check, Clock, PackageOpen } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/data";


const STATUS_COLOR: Record<string, string> = {
  "Menunggu Konfirmasi": "bg-orange-100 text-orange-500",
  "Diproses": "bg-blue-100 text-blue-500",
  "Dikirim": "bg-purple-100 text-purple-500",
  "Selesai": "bg-green-100 text-green-500",
};

const STATUSES = ["Semua", "Menunggu Konfirmasi", "Diproses", "Dikirim", "Selesai"];

const STATUS_ICON: Record<string, React.ReactNode> = {
  "Menunggu Konfirmasi": <Clock size={14} className="text-orange-400" />,
  "Diproses": <Package size={14} className="text-blue-500" />,
  "Dikirim": <Truck size={14} className="text-purple-500" />,
  "Selesai": <Check size={14} className="text-green-500" />,
};

export default function OrderFilter({ orders, initialStatus }: { orders: any[], initialStatus?: string }) {
  const [selected, setSelected] = useState(initialStatus || "Semua");

  useEffect(() => {
    setSelected(initialStatus || "Semua");
  }, [initialStatus]);

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
        <div className="card p-12 text-center flex flex-col items-center">
          <PackageOpen size={48} className="text-gray-300 mb-3" />
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
                <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 ${STATUS_COLOR[order.status] || "bg-gray-100 text-gray-700"}`}>
                  {STATUS_ICON[order.status] || null}
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
                    <p className="text-sm text-gray-500">Total Belanja (termasuk ongkir & admin)</p>
                    <p className="text-lg font-bold text-primary">{formatPrice(order.total_amount + order.shipping_cost + 5000)}</p>
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