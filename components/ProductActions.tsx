"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Zap, MessageCircle, Minus, Plus } from "lucide-react";
import { formatPrice, PriceOption } from "@/lib/data";
import { useRouter } from "next/navigation";
import { addToCart, buyNow } from "@/lib/cart";

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
  storeId: string;
  isOutOfRange?: boolean;
};

export default function ProductActions({
  product,
  priceOptions,
  waNumber,
  sellerName,
  storeId,
  isOutOfRange = false,
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState("1");
  const [selectedVariant, setSelectedVariant] = useState<PriceOption | null>(
    priceOptions.length > 0 ? priceOptions[0] : null
  );
  const [isBuying, setIsBuying] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();

  const handleBuyNow = async () => {
    if (isOutOfRange) return;
    setIsBuying(true);
    try {
      const variantId = product.type === 1 ? (selectedVariant as any)?.id : undefined;
      const res = await buyNow(product.id, Number(quantity), variantId);
      if (res.error) {
        alert(res.error);
      } else {
        router.push(`/checkout?items=${res.cartItemId}`);
      }
    } catch {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsBuying(false);
    }
  };

  const currentPrice = product.type === 1 ? selectedVariant?.price || 0 : product.price || 0;
  const currentStock = product.type === 1 ? selectedVariant?.stock || 0 : product.stock || 0;
  const currentUnit = product.type === 1 ? selectedVariant?.label || "Unit" : product.unit || "Unit";

  const handleIncrease = () => {
    const currentQty = Number(quantity);

    if (currentQty < currentStock) {
      setQuantity((currentQty + 1).toString());
    }
  };

  const handleDecrease = () => {
    const currentQty = Number(quantity);

    if (currentQty > 1) {
      setQuantity((currentQty - 1).toString());
    }
  };

  const handleAddToCart = async () => {
    if (isOutOfRange) return;
    setIsAdding(true);
    try {
      const variantId = product.type === 1 ? (selectedVariant as any)?.id : undefined;
      const res = await addToCart(product.id, Number(quantity), variantId);

      await new Promise((r) => setTimeout(r, 500));

      if (res.error) alert(res.error);
      else alert("Berhasil ditambahkan ke keranjang!");
    } catch {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsAdding(false);
    }
  };

  const variantText = product.type === 1 && selectedVariant ? ` Varian: ${selectedVariant.label}` : "";
  const totalHarga = formatPrice(currentPrice * Number(quantity));
  const message = `Halo ${sellerName}, saya ingin membeli produk ini:\nNama Produk: ${product.name}${variantText}\nJumlah: ${quantity} ${currentUnit}\nTotal Harga: ${totalHarga}\n\nApakah stok masih tersedia?`;
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
  const buyLink = `/checkout?product=${product.id}&qty=${Number(quantity)}${selectedVariant ? `&variant=${(selectedVariant as any).id}` : ""
    }`;

  return (
    <div className="space-y-5">
      <hr className="border-gray-300" />
      {/* Harga */}
      <div>
        <p className="text-2xl font-bold text-gray-900">
          {formatPrice(currentPrice)}
          <span className="text-base font-normal text-gray-400 ml-1">/{currentUnit}</span>
        </p>
      </div>

      <hr className="border-gray-300" />

      {/* Pilih Ukuran / Varian — hanya type 1 */}
      {product.type === 1 && priceOptions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">Pilih ukuran</p>
          <div className="flex flex-wrap gap-2">
            {priceOptions.map((opt) => (
              <button
                key={(opt as any).id || opt.label}
                onClick={() => { setSelectedVariant(opt); setQuantity("1"); }}
                className={`px-4 py-1.5 border rounded-lg text-sm transition-all ${selectedVariant?.label === opt.label
                  ? "border-blue-500 bg-blue-50 text-blue-600 font-medium"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}



      {/* Jumlah + Stok */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">Jumlah</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={handleDecrease}
              disabled={Number(quantity) <= 1}
              className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");

                // boleh kosong saat backspace
                if (raw === "") {
                  setQuantity("");
                  return;
                }

                const val = Number(raw);

                // max stok
                if (val > currentStock) return;

                setQuantity(raw);
              }}
              onBlur={() => {
                // kalau kosong balikin ke 1
                if (quantity === "") {
                  setQuantity("1");
                  return;
                }

                const finalQty = Number(quantity);

                // minimal 1
                if (finalQty < 1) {
                  setQuantity("1");
                }
              }}
              className="w-10 text-center text-sm font-semibold text-gray-800 outline-none bg-transparent"
            />
            <button
              onClick={handleIncrease}
              disabled={Number(quantity) >= currentStock}
              className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-sm text-gray-400">Stok: {currentStock} {currentUnit}</span>
        </div>
      </div>



      {/* Tombol Aksi */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {/* Keranjang */}
        <button
          onClick={handleAddToCart}
          disabled={isAdding || currentStock === 0 || isOutOfRange}
          style={{ borderColor: isOutOfRange ? "#ccc" : "#407BB5", color: isOutOfRange ? "#999" : "#407BB5" }}
          className="w-full sm:flex-1 flex items-center justify-center gap-2 h-11 px-5 border-2 rounded-xl text-sm font-semibold transition hover:bg-blue-50 disabled:hover:bg-transparent disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isAdding ? (
            <span className="w-4 h-4 border-2 border-[#407BB5] border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              <span className="whitespace-nowrap">+ Keranjang</span>
            </>
          )}
        </button>

        {/* Beli Sekarang */}
        <button
          onClick={handleBuyNow}
          disabled={isBuying || currentStock === 0 || isOutOfRange}
          style={{ backgroundColor: isOutOfRange ? "#ccc" : "#407BB5" }}
          className="w-full sm:flex-1 flex items-center justify-center gap-2 h-11 px-5 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isBuying ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            "Beli Sekarang"
          )}
        </button>

        {/* Hubungi WA */}
        <Link
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:flex-1 flex items-center justify-center gap-2 h-11 px-5 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition"
        >
          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.17 1.541 5.943L.057 23.571a.5.5 0 00.6.633l5.782-1.457A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.877 9.877 0 01-5.031-1.378l-.36-.214-3.733.941.993-3.608-.235-.372A9.833 9.833 0 012.106 12C2.106 6.533 6.533 2.106 12 2.106S21.894 6.533 21.894 12 17.467 21.894 12 21.894z" />
          </svg>
          Hubungi
        </Link>
      </div>


    </div>
  );
}
