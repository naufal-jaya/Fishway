"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  mainImage: string;
  extraImages: string[];
  name: string;
};

export default function ProductGallery({ mainImage, extraImages, name }: Props) {
  const [selected, setSelected] = useState(mainImage);

  // Deduplicate images
  const images = [...new Set([mainImage, ...extraImages])].filter(Boolean);

  return (
    <div className="flex flex-col gap-3 p-4 w-full">
      {/* Main Image */}
      <div className="relative w-full aspect-[3/2] rounded-xl overflow-hidden bg-blue-50">
        <Image
          src={selected}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          className="object-cover"
        />
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(img)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors ${
                selected === img ? "border-blue-500" : "border-transparent"
              }`}
            >
              <Image
                src={img}
                alt={`${name} ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}