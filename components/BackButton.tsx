"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  href?: string;
  className?: string;
}

export default function BackButton({ href, className = "" }: BackButtonProps) {
  const router = useRouter();

  if (href) {
    return (
      <Link
        href={href}
        className={`inline-flex items-center text-gray-400 hover:text-[#407BB5] transition-colors ${className}`}
      >
        <ChevronLeft className="w-5 h-5" />
      </Link>
    );
  }

  return (
    <button
      onClick={() => router.back()}
      className={`inline-flex items-center text-gray-400 hover:text-[#407BB5] transition-colors ${className}`}
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
  );
}

