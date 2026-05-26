"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type GalleryImage = {
  url: string;
  caption?: string | null;
};

type Props = {
  mainImage: string;
  extraImages?: string[];
  images?: GalleryImage[];
  name: string;
};

export default function ProductGallery({ mainImage, extraImages = [], images: galleryImages, name }: Props) {
  const normalizedImages = galleryImages && galleryImages.length > 0
    ? galleryImages
    : [mainImage, ...extraImages].map((url) => ({ url, caption: null }));

  const images = normalizedImages.filter((item, index, self) =>
    item.url && self.findIndex((candidate) => candidate.url === item.url) === index
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = images[selectedIndex] || { url: "/images/default.png", caption: null };
  const showNavigation = images.length > 1;

  const goToPrevious = () => {
    setSelectedIndex((currentIndex) =>
      currentIndex === 0 ? images.length - 1 : currentIndex - 1
    );
  };

  const goToNext = () => {
    setSelectedIndex((currentIndex) =>
      currentIndex === images.length - 1 ? 0 : currentIndex + 1
    );
  };

  return (
    <div className="flex flex-col gap-3 p-4 w-full">
      {/* Main Image */}
      <div className="relative w-full aspect-[3/2] rounded-xl overflow-hidden bg-blue-50">
        <Image
          src={selected.url}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          className="object-cover"
        />
        {showNavigation && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/50 p-1 shadow-sm backdrop-blur-sm">
            <button
              type="button"
              onClick={goToPrevious}
              className="flex h-8 w-8 items-center justify-center text-gray-600 focus:outline-none"
              aria-label="Foto sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={goToNext}
              className="flex h-8 w-8 items-center justify-center text-gray-600 focus:outline-none"
              aria-label="Foto berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      {selected.caption && (
        <p className="text-sm text-gray-500">{selected.caption}</p>
      )}

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors ${
                selected.url === img.url ? "border-blue-500" : "border-transparent"
              }`}
            >
              <Image
                src={img.url}
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
