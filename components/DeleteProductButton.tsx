"use client";

import { Trash } from "lucide-react";

export default function DeleteProductButton() {
  return (
    <button 
      type="submit" 
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500"
      onClick={(e) => {
        if (!confirm('Yakin ingin menghapus produk ini?')) e.preventDefault();
      }}
    >
      <Trash size={12} />
      Hapus
    </button>
  );
}
