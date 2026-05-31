"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ToastContext";

export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export type ProductImageItem = {
  id?: string;
  url?: string;
  file?: File;
  previewUrl: string;
  caption: string;
  sortOrder?: number;
};

type Props = {
  images: ProductImageItem[];
  onAdd: (files: File[]) => void;
  onCaptionChange: (index: number, caption: string) => void;
  onRemove: (index: number) => void;
  maxImages?: number;
};

export default function ProductImageManager({
  images,
  onAdd,
  onCaptionChange,
  onRemove,
  maxImages = 10,
}: Props) {
  const remaining = maxImages - images.length;
  const { showToast } = useToast();

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-sm font-semibold text-gray-800">Foto Produk</label>
        <span className="text-xs text-gray-400">{images.length}/{maxImages}</span>
      </div>

      {images.length === 0 ? (
        <div className="flex aspect-square flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 text-center text-gray-400">
          <ImagePlus className="h-10 w-10" />
          <p className="text-sm">Preview foto akan muncul setelah gambar dipilih.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {images.map((image, index) => (
            <div key={`${image.id || image.previewUrl}-${index}`} className="rounded-lg border border-gray-100 bg-white p-3">
              <div className="flex gap-3">
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <img src={image.previewUrl} alt={`Preview foto produk ${index + 1}`} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      {index === 0 ? "Foto utama" : `Foto ${index + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemove(index)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                      aria-label={`Hapus foto ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={image.caption}
                    onChange={(event) => onCaptionChange(index, event.target.value)}
                    placeholder="Caption opsional"
                    className="w-full rounded-lg border p-2 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        multiple
        disabled={remaining <= 0}
        onChange={(event) => {
          const selectedFiles = Array.from(event.target.files || []);
          const validFiles = selectedFiles.filter((file) => file.size <= MAX_PRODUCT_IMAGE_SIZE_BYTES);

          if (validFiles.length !== selectedFiles.length) {
            showToast({ type: "warning", message: "Ukuran setiap foto maksimal 10 MB." });
          }

          onAdd(validFiles);
          event.target.value = "";
        }}
        className="w-full rounded-lg border bg-white p-2 text-sm disabled:cursor-not-allowed disabled:bg-gray-100"
      />
      {remaining <= 0 && <p className="text-xs text-gray-400">Maksimal 10 foto produk.</p>}
    </div>
  );
}