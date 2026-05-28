"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center text-gray-400 hover:text-[#407BB5]"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
  );
}
