import Link from "next/link";
import { MapPin, Store } from 'lucide-react';
import { Product, formatPrice } from "@/lib/data";
import Image from "next/image";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`} className="block group min-w-0">
      <div className="card flex flex-col h-[280px] overflow-hidden hover:shadow-md transition-shadow min-w-0 bg-white">
        {/* IMAGE ROW */}
        <div className="bg-blue-100 h-36 flex-shrink-0 flex items-center justify-center text-5xl overflow-hidden relative">
          <Image 
            src={product.gambar || "/images/default.png"} 
            alt={product.name || "Product"} 
            fill 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        </div>

        {/* CONTENT ROW */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between min-w-0">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs text-gray-500 tracking-wide truncate flex items-center gap-1">
              <Store className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500 shrink-0" />
              <span>{product.seller}</span>
            </div>

            <h3 className="font-semibold text-gray-800 text-sm sm:text-base group-hover:text-primary transition-colors line-clamp-1 mt-0.5">
              {product.name}
            </h3>

            {/* PRICE SECTION */}
            <div className="mt-1 min-w-0">
              {product.type === 0 ? (
                <p className="text-primary font-bold text-sm sm:text-base truncate">
                  {formatPrice(product.price)}
                  <span className="text-gray-400 font-normal text-[10px] sm:text-xs">
                    /{product.unit}
                  </span>
                </p>
              ) : (
                <div className="min-w-0">
                  <p className="text-primary font-bold text-xs sm:text-sm truncate">
                    {formatPrice(
                      Math.min(...product.priceOptions.map((p) => p.price)),
                    )}{" "}
                    -{" "}
                    {formatPrice(
                      Math.max(...product.priceOptions.map((p) => p.price)),
                    )}
                  </p>

                  <p className="text-[9px] sm:text-[10px] text-gray-400 truncate">
                    {product.priceOptions.length} varian tersedia
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-between pt-2 gap-1.5 border-t border-gray-50 mt-2 min-w-0">
            <div className="text-[10px] sm:text-xs flex text-gray-500 items-center min-w-0 flex-1">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5 shrink-0" /> 
              <span className="truncate">{product.location}</span>
            </div>

            <p className="text-[10px] sm:text-xs text-gray-500 shrink-0">
              Stok: {product.type === 1
                ? product.priceOptions.reduce((sum, p) => sum + p.stock, 0)
                : product.stock}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
