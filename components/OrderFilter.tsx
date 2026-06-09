"use client";

import { useState, useEffect } from "react";
import { Package, Truck, Check, Clock, PackageOpen, X, Bike, Store } from "lucide-react";
import Link from "next/link";
import { formatPrice, ORDER_STATUS_COLORS, ORDER_STATUSES, parseSupabaseDate } from "@/lib/data";

const STATUSES = ["Semua", ...ORDER_STATUSES];

import StatusBadge from "./StatusBadge";

const SHIPPING_ICON: Record<string, React.ReactNode> = {
  "Ojol": <Bike size={12} />,
  "Ambil Sendiri": <Store size={12} />,
  "Dianterin Penjual": <Truck size={12} />,
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
            className={`px-4 py-1.5 rounded-xl text-sm whitespace-nowrap border transition-all duration-300 ${selected === status
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
            const parsedDate = parseSupabaseDate(order.created_at);
            const orderDate = parsedDate.toLocaleDateString('id-ID', {
              timeZone: 'Asia/Jakarta',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            const orderTime = parsedDate.toLocaleTimeString('id-ID', {
              timeZone: 'Asia/Jakarta',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }).replace('.', ':') + ' WIB';

            const storeData = Array.isArray(order.stores) ? order.stores[0] : order.stores;
            const storeName = storeData?.name || "Toko";
            const storeId = storeData?.id || order.store_id || null;
            const shippingMethod = order.shipping_method || null;

            return (
              <div key={order.id} className="card p-5">
                {/* Header: toko + tanggal + status */}
                <div className="flex justify-between items-start mb-4 border-b pb-4">
                  <div>
                    {/* Nama toko sebagai link */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <Store size={14} className="text-primary" />
                      {storeId ? (
                        <Link
                          href={`/store/${storeId}`}
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          {storeName}
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold text-primary">{storeName}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{orderDate} • {orderTime}</p>
                    <p className="font-mono text-xs text-gray-300 mt-0.5">#{order.id.split("-")[0].toUpperCase()}</p>
                  </div>
                  <StatusBadge status={order.status} className="text-xs px-3 py-1" />
                </div>

                {/* Produk-produk dari toko ini */}
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

                {/* Metode pengiriman */}
                {shippingMethod && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="text-gray-400">
                      {SHIPPING_ICON[shippingMethod] ?? <Truck size={12} />}
                    </span>
                    <span>{shippingMethod}</span>
                  </div>
                )}

                {/* Footer: total + tombol detail */}
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Total (termasuk ongkir & admin)</p>
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