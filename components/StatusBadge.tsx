import { ORDER_STATUS_COLORS } from "@/lib/data";
import { Clock, Package, Truck, Check, X } from "lucide-react";

export const STATUS_ICONS: Record<string, React.ElementType> = {
  "Menunggu Pembayaran": Clock,
  "Menunggu Konfirmasi": Clock,
  "Diproses": Package,
  "Dikirim": Truck,
  "Selesai": Check,
  "Proses Pembatalan": X,
  "Dibatalkan": X,
};

export default function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const colorClass = ORDER_STATUS_COLORS[status] || "bg-gray-100 text-gray-700";
  const Icon = STATUS_ICONS[status];

  return (
    <span className={`inline-flex rounded-full   items-center gap-1.5 font-medium ${colorClass} ${className}`}>
      {Icon && <Icon size={14} />}
      <span>{status}</span>
    </span>
  );
}
