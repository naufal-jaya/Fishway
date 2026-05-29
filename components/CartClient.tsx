"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/data";
import CartItemControl from "@/components/CartItemControl";

export type CartItemData = {
  id: string;
  productId: string;
  name: string;
  seller: string;
  storeId?: string;
  location: string;
  gambar: string;
  qty: number;
  price: number;
  unit: string;
  stock: number;
};

type Props = {
  items: CartItemData[];
};

const BIAYA_ADMIN = 5000;

export default function CartClient({ items }: Props) {
  const router = useRouter();
  // Set of cart item IDs yang sedang dicentang (default: semua tercentang)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    () => new Set(items.map((i) => i.id))
  );

  const toggleItem = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (checkedIds.size === items.length) {
      setCheckedIds(new Set()); // uncheck all
    } else {
      setCheckedIds(new Set(items.map((i) => i.id))); // check all
    }
  };

  const allChecked = checkedIds.size === items.length;
  const someChecked = checkedIds.size > 0 && checkedIds.size < items.length;

  // Hitung subtotal hanya dari item yang tercentang
  const subtotal = useMemo(() => {
    return items
      .filter((i) => checkedIds.has(i.id))
      .reduce((sum, i) => sum + i.price * i.qty, 0);
  }, [items, checkedIds]);

  const checkedCount = checkedIds.size;
  const total = subtotal + (checkedCount > 0 ? BIAYA_ADMIN : 0);

  // Buat URL checkout dengan daftar ID item yang dipilih
  const checkoutUrl = useMemo(() => {
    const ids = Array.from(checkedIds).join(",");
    return `/checkout?items=${ids}`;
  }, [checkedIds]);

  if (items.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="flex justify-center mb-4">
          <ShoppingCart className="w-16 h-16 text-gray-300" strokeWidth={1.5} />
        </div>
        <p className="text-gray-500 mb-4">Keranjang kamu kosong</p>
        <Link href="/" className="btn-primary inline-block">
          Mulai Belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr_380px] items-start">
      {/* Item List */}
      <div className="space-y-3 md:pr-6 md:border-r border-b md:border-b-0 border-gray-200 py-2 pb-6 md:pb-2">
        {/* Pilih Semua */}
        <label className="flex items-center gap-3 px-1 py-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allChecked}
            ref={(el) => {
              if (el) el.indeterminate = someChecked;
            }}
            onChange={toggleAll}
            className="flex-shrink-0 cursor-pointer w-4 h-4 accent-primary"
          />
          <span className="text-sm font-medium text-gray-600">
            Pilih Semua ({items.length} item)
          </span>
        </label>

        {items.map((item) => {
          const isChecked = checkedIds.has(item.id);
          return (
            <div key={item.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleItem(item.id)}
                className="flex-shrink-0 cursor-pointer w-4 h-4 accent-primary"
              />
              <div
                className={`card p-4 flex gap-4 items-center relative flex-1 transition-opacity ${
                  isChecked ? "opacity-100" : "opacity-50"
                }`}
              >
                {/* Image */}
                <Link
                  href={`/product/${item.productId}`}
                  className="bg-blue-50 w-16 h-16 rounded-lg flex-shrink-0 relative overflow-hidden hover:opacity-90 transition-opacity"
                >
                  <Image
                    src={item.gambar || "/images/default.png"}
                    alt={item.name || "Product"}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </Link>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${item.productId}`} className="hover:text-primary transition-colors block">
                    <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                  </Link>
                  <p className="text-sm text-gray-500">
                    {item.storeId ? (
                      <Link href={`/store/${item.storeId}`} className="hover:text-primary hover:underline transition-colors font-medium">
                        {item.seller}
                      </Link>
                    ) : (
                      item.seller
                    )}{" "}
                    · {item.location}
                  </p>
                  <p className="text-primary font-bold mt-1">
                    {formatPrice(item.price)}/{item.unit}
                  </p>
                </div>
                {/* Qty Control and Remove */}
                <CartItemControl itemId={item.id} initialQty={item.qty} maxQty={item.stock} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="md:pl-6 pt-6 md:pt-2 w-full">
        <div className="card p-5 space-y-3 md:sticky md:top-20">
          <h2 className="font-bold text-gray-800 text-lg">Ringkasan Pesanan</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({checkedCount} item dipilih)</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Biaya Admin</span>
              <span>{checkedCount > 0 ? formatPrice(BIAYA_ADMIN) : "-"}</span>
            </div>
          </div>
          <div className="border-t pt-3 flex justify-between font-bold text-gray-800">
            <div className="flex flex-col">
              <span>Total</span>
              <span className="text-xs font-normal text-gray-400">
                (Belum Termasuk Ongkir)
              </span>
            </div>
            <span className="text-primary text-base self-center">{formatPrice(total)}</span>
          </div>
          <Link
            href={checkoutUrl}
            className={`bg-primary text-white font-semibold w-full text-center block py-3 rounded-xl transition ${
              checkedCount === 0
                ? "opacity-50 pointer-events-none"
                : "hover:bg-primary/90"
            }`}
          >
            Checkout {checkedCount > 0 ? `(${checkedCount} item)` : ""}
          </Link>
        </div>
      </div>
    </div>
  );
}
