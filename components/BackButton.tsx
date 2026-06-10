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

  const buttonClasses = `inline-flex items-center gap-1 text-gray-500 hover:text-[#407BB5] transition-colors font-medium text-sm ${className}`;

  if (href) {
    return (
      <Link href={href} className={buttonClasses}>
        <ChevronLeft className="w-5 h-5" />
        <span>Kembali</span>
      </Link>
    );
  }

  return (
    <button onClick={() => router.back()} className={buttonClasses}>
      <ChevronLeft className="w-5 h-5" />
      <span>Kembali</span>
    </button>
  );
}

