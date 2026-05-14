"use client";

import { useState } from "react";
import { updateCartItemQty, removeCartItem } from "@/lib/cart";

interface CartItemControlProps {
  itemId: string;
  initialQty: number;
}

export default function CartItemControl({ itemId, initialQty }: CartItemControlProps) {
  const [qty, setQty] = useState(initialQty);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleIncrease = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    const newQty = qty + 1;
    setQty(newQty);
    await updateCartItemQty(itemId, newQty);
    setIsUpdating(false);
  };

  const handleDecrease = async () => {
    if (isUpdating || qty <= 1) return;
    setIsUpdating(true);
    const newQty = qty - 1;
    setQty(newQty);
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
          disabled={isUpdating || qty <= 1}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 border-r border-gray-300 disabled:opacity-50"
        >
          −
        </button>
        <span className="w-8 h-8 flex items-center justify-center text-sm font-medium">
          {qty}
        </span>
        <button
          onClick={handleIncrease}
          disabled={isUpdating}
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
