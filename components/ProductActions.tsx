"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice, PriceOption } from "@/lib/data";
import { addToCart } from "@/lib/cart";

type ProductActionsProps = {
  product: {
    id: string;
    name: string;
    type: number;
    price: number | null;
    unit: string | null;
    stock: number | null;
  };
  priceOptions: PriceOption[];
  waNumber: string;
  sellerName: string;
};

export default function ProductActions({
  product,
  priceOptions,
  waNumber,
  sellerName,
}: ProductActionsProps) {
  // State
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<PriceOption | null>(
    priceOptions.length > 0 ? priceOptions[0] : null
  );
  const [isAdding, setIsAdding] = useState(false);

  // Compute values
  const currentPrice =
    product.type === 1
      ? selectedVariant?.price || 0
      : product.price || 0;

  const currentStock =
    product.type === 1
      ? selectedVariant?.stock || 0
      : product.stock || 0;

  const currentUnit =
    product.type === 1
      ? selectedVariant?.label || "Unit"
      : product.unit || "Unit";

  // Handlers
  const handleIncrease = () => {
    if (quantity < currentStock) setQuantity((q) => q + 1);
  };

  const handleDecrease = () => {
    if (quantity > 1) setQuantity((q) => q - 1);
  };

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      const variantId = product.type === 1 ? selectedVariant?.id : undefined;
      const res = await addToCart(product.id, quantity, variantId);

      if (res.error) {
        alert(res.error);
      } else {
        alert("Berhasil ditambahkan ke keranjang!");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsAdding(false);
    }
  };

  // WhatsApp Message Formatting
  const variantText =
    product.type === 1 && selectedVariant
      ? ` Varian: ${selectedVariant.label}`
      : "";
  const totalHarga = formatPrice(currentPrice * quantity);

  const message = `Halo ${sellerName}, saya ingin membeli produk ini:
Nama Produk: ${product.name}${variantText}
Jumlah: ${quantity} ${currentUnit}
Total Harga: ${totalHarga}

Apakah stok masih tersedia?`;

  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="space-y-6">
      {/* Dynamic Price Display */}
      <div>
        <p className="text-3xl font-bold text-primary">
          {formatPrice(currentPrice)}
          <span className="text-lg font-normal text-gray-400 ml-1">
            /{currentUnit}
          </span>
        </p>
        <p className="text-sm text-gray-500 mt-1">Stok tersisa: {currentStock}</p>
      </div>

      {/* Variant Selection (Type 1 only) */}
      {product.type === 1 && priceOptions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-800">Pilih Varian:</p>
          <div className="flex flex-wrap gap-2">
            {priceOptions.map((opt) => (
              <button
                key={opt.id || opt.label}
                onClick={() => {
                  setSelectedVariant(opt);
                  setQuantity(1); // Reset qty on variant change
                }}
                className={`px-4 py-2 border rounded-xl text-sm transition-all ${selectedVariant?.label === opt.label
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Selection */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-800">Kuantitas:</p>
        <div className="flex items-center gap-3 w-fit border border-gray-200 rounded-xl p-1 bg-white">
          <button
            onClick={handleDecrease}
            disabled={quantity <= 1}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            -
          </button>
          <span className="w-8 text-center font-semibold text-gray-800">
            {quantity}
          </span>
          <button
            onClick={handleIncrease}
            disabled={quantity >= currentStock}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <Link
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 btn-primary text-center py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <span>💬</span> WhatsApp
        </Link>

        <button
          onClick={handleAddToCart}
          disabled={isAdding || currentStock === 0}
          className="flex-1 btn-outline text-center py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>🛒</span> {isAdding ? "Menambahkan..." : "Keranjang"}
        </button>
      </div>
    </div>
  );
}
