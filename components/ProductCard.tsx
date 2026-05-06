import Link from "next/link";
import { MapPin } from 'lucide-react';
import { Product, formatPrice } from "@/lib/data";
import Image from "next/image";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`} className="block group">
      <div className="card gap-0 grid grid-row-2 h-[280px] overflow-hidden hover:shadow-md transition-shadow ">
        <div className="bg-blue-100 h-36 flex items-center justify-center text-5xl overflow-hidden relative">
          <Image 
            src={product.gambar || "/images/default.png"} 
            alt={product.name || "Product"} 
            fill 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        </div>

        <div className="p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">
            {product.category}
          </p>

          <h3 className="font-semibold text-gray-800 group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* PRICE SECTION */}
          {product.type === 0 ? (
            <p className="text-primary font-bold text-lg">
              {formatPrice(product.price)}
              <span className="text-gray-400 font-normal text-sm">
                /{product.unit}
              </span>
            </p>
          ) : (
            <div>
              <p className="text-primary font-bold text-lg">
                {formatPrice(
                  Math.min(...product.priceOptions.map((p) => p.price)),
                )}{" "}
                -{" "}
                {formatPrice(
                  Math.max(...product.priceOptions.map((p) => p.price)),
                )}
              </p>

              <p className="text-xs text-gray-400">
                {product.priceOptions.length} varian tersedia
              </p>
            </div>
          )}

          {/* FOOTER */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs flex text-gray-500 items-center"><MapPin className="w-4 h-4 mr-0.5" /> {product.location}</p>

            <p className="text-xs text-gray-500">
              {product.type === 1
                ? `Stok: ${product.priceOptions.reduce((sum, p) => sum + p.stock, 0)}`
                : `Stok: ${product.stock}`}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
