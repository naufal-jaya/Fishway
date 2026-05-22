"use client";

import { useState } from "react";
import { updateCartItemQty, removeCartItem } from "@/lib/cart";

interface CartItemControlProps {
  itemId: string;
  initialQty: number;
  maxQty?: number;
}

export default function CartItemControl({ itemId, initialQty, maxQty = 99 }: CartItemControlProps) {
  const [qty, setQty] = useState(initialQty.toString());
  const [isUpdating, setIsUpdating] = useState(false);

  const handleIncrease = async () => {
    const currentQty = Number(qty);
    if (isUpdating || currentQty >= maxQty) return;
    setIsUpdating(true);
    const newQty = currentQty + 1;
    setQty(newQty.toString());
    await updateCartItemQty(itemId, newQty);
    setIsUpdating(false);
  };

  const handleDecrease = async () => {
    const currentQty = Number(qty);
    if (isUpdating || currentQty <= 1) return;
    setIsUpdating(true);
    const newQty = currentQty - 1;
    setQty(newQty.toString());
    await updateCartItemQty(itemId, newQty);
    setIsUpdating(false);
  };

  const handleRemove = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    const confirmDelete = window.confirm("Hapus item dari keranjang?");
    if (confirmDelete) {
      await removeCartItem(itemId);
    } else {
      setIsUpdating(false);
    }
  };

  return (
    <>
      {/* Qty Control */}
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden flex-shrink-0">
        <button
          onClick={handleDecrease}
          disabled={isUpdating || Number(qty) <= 1}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 border-r border-gray-300 disabled:opacity-50"
        >
          −
        </button>
    <input
      type="text"
      inputMode="numeric"
      value={qty}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9]/g, "");
        // Boleh kosong sementara
        if (raw === "") {
          setQty("");
          return;
        }
        const val = Number(raw);
        // Tidak boleh lebih dari stock
        if (val > maxQty) return;
        setQty(raw);
      }}
      onBlur={async () => {
        // Kalau kosong → confirm hapus
        if (qty === "") {
          const confirmDelete = window.confirm(
            "Jumlah kosong. Hapus produk dari keranjang?"
          );
          if (confirmDelete) {
            setIsUpdating(true);
            await removeCartItem(itemId);
            return;
          }
          // kalau cancel balikin ke 1
          setQty("1");
          return;
        }
        const finalQty = Number(qty);
        // validasi minimum
        if (finalQty < 1) {
          setQty("1");
          setIsUpdating(true);
          await updateCartItemQty(itemId, 1);
          setIsUpdating(false);
          return;
        }
        setIsUpdating(true);
        await updateCartItemQty(itemId, finalQty);
        setIsUpdating(false);
      }}
          className="w-10 h-8 text-center text-sm font-medium border-none outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={handleIncrease}
          disabled={isUpdating || Number(qty) >= maxQty}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 border-l border-gray-300 disabled:opacity-50"
        >
          +
        </button>
      </div>
        <button
            onClick={handleRemove}
            disabled={isUpdating}
            className="absolute top-3 right-3 text-gray-400 hover:text-red-400 text-sm leading-none disabled:opacity-50"
          >
            {isUpdating ? "..." : "x"}
          </button>
    </>
  );
}
