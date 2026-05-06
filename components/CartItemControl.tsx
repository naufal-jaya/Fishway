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
      <div className="flex items-center gap-2 flex-shrink-0">
        <button 
          onClick={handleDecrease}
          disabled={isUpdating || qty <= 1}
          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-sm disabled:opacity-50"
        >
          −
        </button>
        <span className="w-6 text-center font-medium">
          {qty}
        </span>
        <button 
          onClick={handleIncrease}
          disabled={isUpdating}
          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-sm disabled:opacity-50"
        >
          +
        </button>
      </div>

      <div className="text-right flex-shrink-0 flex flex-col justify-end ml-4">
        <button 
          onClick={handleRemove}
          disabled={isUpdating}
          className="text-red-400 hover:text-red-600 text-xs disabled:opacity-50"
        >
          {isUpdating ? "..." : "Hapus"}
        </button>
      </div>
    </>
  );
}
