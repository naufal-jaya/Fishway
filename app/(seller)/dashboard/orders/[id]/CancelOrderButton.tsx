"use client";

import { useState } from "react";
import { XCircle, MessageCircle } from "lucide-react";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  products: any; // Simplified for now
};

export default function CancelOrderButton({
  action,
  buyerPhone,
  orderId,
  orderItems,
  orderDate
}: {
  action: (formData: FormData) => Promise<void>;
  buyerPhone?: string;
  orderId?: string;
  orderItems: OrderItem[];
  orderDate?: string;
}) {
  const [open, setOpen] = useState(false);

  // State for tracking dead items: { [itemId]: quantityDead }
  const [deadItems, setDeadItems] = useState<Record<string, number>>({});

  // Filter only Ikan Hias
  const ikanHiasItems = orderItems.filter(item => {
    const product = Array.isArray(item.products) ? item.products[0] : item.products;
    return product?.category === "Ikan Hias";
  });

  const handleCheckboxChange = (itemId: string, checked: boolean, maxQty: number) => {
    setDeadItems(prev => {
      const next = { ...prev };
      if (checked) {
        next[itemId] = maxQty; // default select all
      } else {
        delete next[itemId];
      }
      return next;
    });
  };

  const handleQtyChange = (itemId: string, qty: number, maxQty: number) => {
    const safeQty = Math.max(1, Math.min(qty, maxQty));
    setDeadItems(prev => ({
      ...prev,
      [itemId]: safeQty
    }));
  };

  // Generate WA link
  let deadItemsText = "";
  let deadItemsArray: string[] = [];

  Object.entries(deadItems).forEach(([itemId, qty], index) => {
    const item = orderItems.find(i => i.id === itemId);
    if (item) {
      const product = Array.isArray(item.products) ? item.products[0] : item.products;
      deadItemsArray.push(`- ${product?.name} (${qty} ekor)`);
    }
  });

  if (deadItemsArray.length > 0) {
    deadItemsText = deadItemsArray.join("\n");
  } else {
    deadItemsText = "- (Belum ada ikan dipilih)";
  }

  const waMessage = `Halo, pesanan anda:
ID: ${orderId}
Tanggal: ${orderDate}

Terkendala karena ada ikan yang mati saat pengiriman:
${deadItemsText}

Kami telah mengajukan pembatalan untuk ikan tersebut. Mohon cek pesanan Anda di aplikasi untuk memproses refund, dan mohon kirimkan nomor rekening Anda ke nomor ini ya. Terima kasih.`;

  const waLink = buyerPhone && buyerPhone !== "Tidak ada nomor"
    ? `https://wa.me/${buyerPhone.replace(/\D/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(waMessage)}`
    : "#";

  const isAnySelected = Object.keys(deadItems).length > 0;

  return (
    <div className="mt-6 pt-2 border-t border-red-100">
      <p className="text-sm font-semibold text-red-500 mb-2">Ikan mati di perjalanan?</p>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-red-500 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors"
        >
          <XCircle className="w-4 h-4" />
          Ajukan Pembatalan
        </button>
      ) : (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <h3 className="text-sm font-bold text-red-700 mb-1">Ajukan Refund Ikan Mati</h3>
          <p className="text-xs text-red-500 mb-4">Pilih ikan yang mati dan jumlahnya.</p>

          <div className="mb-4 space-y-3 bg-white p-3 rounded-lg border border-red-100">
            {ikanHiasItems.map(item => {
              const product = Array.isArray(item.products) ? item.products[0] : item.products;
              const isSelected = !!deadItems[item.id];
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={`check-${item.id}`}
                    checked={isSelected}
                    onChange={(e) => handleCheckboxChange(item.id, e.target.checked, item.quantity)}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <div className="flex-1">
                    <label htmlFor={`check-${item.id}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                      {product?.name}
                    </label>
                    <p className="text-xs text-gray-500">Dipesan: {item.quantity}</p>
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Mati:</span>
                      <input
                        type="number"
                        min="1"
                        max={item.quantity}
                        value={deadItems[item.id]}
                        onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value) || 1, item.quantity)}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-400"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <form action={action} className="flex flex-col gap-3">
            <input type="hidden" name="deadItems" value={JSON.stringify(deadItems)} />

            <div className="mt-2 space-y-2">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!isAnySelected) {
                    e.preventDefault();
                    alert("Pilih minimal satu ikan yang mati terlebih dahulu.");
                  }
                }}
                className={`flex items-center justify-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors w-full ${isAnySelected ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'}`}
              >
                <MessageCircle className="w-4 h-4" />
                Hubungi Pembeli (WhatsApp)
              </a>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={!isAnySelected}
                  className={`text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex-1 ${isAnySelected ? 'bg-red-500 hover:bg-red-600' : 'bg-red-300 cursor-not-allowed'}`}
                >
                  Ajukan Pembatalan
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-100 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}