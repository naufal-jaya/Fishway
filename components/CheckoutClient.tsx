"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { checkoutCart } from "@/lib/cart";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/data";
import { calculateDistance } from "@/lib/distance";
import {
  ChevronDown,
  CheckCircle,
  Bike,
  Store,
  Truck,
  MapPin,
  AlertTriangle,
  Loader2,
  Navigation,
  ChevronLeft,
  ClipboardList,
  CreditCard,
  Smartphone,
} from "lucide-react";

/** Icon per metode pengiriman */
const SHIPPING_ICONS: Record<string, React.ReactNode> = {
  gosend: <Bike size={16} />,
  ambil: <Store size={16} />,
  penjual: <Truck size={16} />,
};

type Address = {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  lat?: number | null;
  lon?: number | null;
  is_primary: boolean;
};

type StoreInfo = {
  id: string;
  name: string;
  address?: string;
  lat?: number;
  lon?: number;
  maxDistance?: number;
  shippingOjol?: boolean;
  shippingAmbil?: boolean;
  shippingPenjual?: boolean;
  pricePerKm?: number;
};

type Props = {
  addresses?: Address[];
  items?: {
    id: string;
    name: string;
    qty: number;
    price: number;
    storeId: string;
  }[];
  stores?: StoreInfo[];
  selectedItemIds?: string[];
};

export default function CheckoutClient({
  addresses = [],
  items = [],
  stores = [],
  selectedItemIds = [],
}: Props) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [addressDropdownOpen, setAddressDropdownOpen] = useState(false);
  const router = useRouter();

  // Address Selection
  const primaryAddress = addresses.find((a) => a.is_primary) || addresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState(primaryAddress?.id || "");
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // Selected Shipping method per store: { storeId: optionId }
  const [selectedShipping, setSelectedShipping] = useState<Record<string, string>>({});

  // Build shipping options per store based on the store's settings
  const storeShippingOptions = useMemo(() => {
    const map: Record<string, { id: string; label: string; desc: string; maxKm?: number }[]> = {};
    stores.forEach((store) => {
      const opts: { id: string; label: string; desc: string; maxKm?: number }[] = [];
      if (store.shippingOjol !== false) {
        opts.push({ id: "gosend", label: "GoSend", desc: "Ongkir dibayar terpisah", maxKm: store.maxDistance ?? 10 });
      }
      if (store.shippingAmbil !== false) {
        opts.push({ id: "ambil", label: "Ambil Sendiri", desc: "Ambil langsung ke toko" });
      }
      if (store.shippingPenjual) {
        opts.push({
          id: "penjual",
          label: "Dianterin Penjual",
          desc: `Tarif: Rp${(store.pricePerKm ?? 3000).toLocaleString("id-ID")}/km · dihitung berdasarkan jarak`,
          maxKm: store.maxDistance ?? 10,
        });
      }
      // Fallback jika semua dinonaktifkan
      if (opts.length === 0) {
        opts.push({ id: "gosend", label: "GoSend", desc: "Ongkir dibayar terpisah", maxKm: 10 });
      }
      map[store.id] = opts;
    });
    return map;
  }, [stores]);

  // Initialize selected shipping for each store to first option
  useEffect(() => {
    const initialShipping: Record<string, string> = {};
    stores.forEach((store) => {
      if (!selectedShipping[store.id]) {
        initialShipping[store.id] = storeShippingOptions[store.id]?.[0]?.id || "gosend";
      } else {
        initialShipping[store.id] = selectedShipping[store.id];
      }
    });
    setSelectedShipping(initialShipping);
  }, [stores, storeShippingOptions]);

  // Distance state per store: { storeId: { distance, loading, failed } }
  const [storeDistances, setStoreDistances] = useState<Record<string, { distance: number | null; loading: boolean; failed: boolean }>>({});

  // Calculate distance for each store when address or shipping selection changes
  useEffect(() => {
    if (!selectedAddress) return;

    stores.forEach((store) => {
      const optionId = selectedShipping[store.id] || storeShippingOptions[store.id]?.[0]?.id;
      const opts = storeShippingOptions[store.id] || [];
      const currentOption = opts.find((s) => s.id === optionId);
      const maxKm = currentOption?.maxKm;

      if (!maxKm || !store.lat || !store.lon) {
        setStoreDistances((prev) => ({
          ...prev,
          [store.id]: { distance: null, loading: false, failed: false },
        }));
        return;
      }

      setStoreDistances((prev) => ({
        ...prev,
        [store.id]: { distance: prev[store.id]?.distance ?? null, loading: true, failed: false },
      }));

      if (selectedAddress.lat && selectedAddress.lon && store.lat && store.lon) {
        const km = calculateDistance(store.lat, store.lon, selectedAddress.lat, selectedAddress.lon);
        setStoreDistances((prev) => ({
          ...prev,
          [store.id]: { distance: parseFloat(km.toFixed(1)), loading: false, failed: false },
        }));
      } else {
        setStoreDistances((prev) => ({
          ...prev,
          [store.id]: { distance: null, loading: false, failed: true },
        }));
      }
    });
  }, [selectedAddressId, selectedShipping, stores, storeShippingOptions, selectedAddress]);

  // Group items by storeId
  const itemsByStore = useMemo(() => {
    const map: Record<string, typeof items> = {};
    items.forEach((item) => {
      const sId = item.storeId || "unknown";
      if (!map[sId]) map[sId] = [];
      map[sId].push(item);
    });
    return map;
  }, [items]);

  // Calculate subtotals
  const storeSubtotals = useMemo(() => {
    const subtotals: Record<string, number> = {};
    Object.entries(itemsByStore).forEach(([storeId, storeItems]) => {
      subtotals[storeId] = storeItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    });
    return subtotals;
  }, [itemsByStore]);

  // Shipping costs per store — untuk 'penjual': kalkulasi jarak × tarif per km
  const storeShippingCosts = useMemo(() => {
    const costs: Record<string, number> = {};
    stores.forEach((store) => {
      const optionId = selectedShipping[store.id] || storeShippingOptions[store.id]?.[0]?.id;
      if (optionId === "penjual") {
        const dist = storeDistances[store.id]?.distance;
        const rate = store.pricePerKm ?? 3000;
        costs[store.id] = dist != null ? Math.round(dist * rate) : 0;
      } else {
        costs[store.id] = 0; // gosend & ambil: 0 (dibayar terpisah atau gratis)
      }
    });
    return costs;
  }, [selectedShipping, stores, storeShippingOptions, storeDistances]);

  // Totals calculations
  const productSubtotal = Object.values(storeSubtotals).reduce((sum, val) => sum + val, 0);
  const totalShipping = Object.values(storeShippingCosts).reduce((sum, val) => sum + val, 0);
  const biayaAdmin = 5000;
  const totalPay = productSubtotal + totalShipping + biayaAdmin;

  // Validation: check if any selected shipping method is out of range
  const isAnyStoreOutOfRange = useMemo(() => {
    return stores.some((store) => {
      const optionId = selectedShipping[store.id] || storeShippingOptions[store.id]?.[0]?.id;
      const opts = storeShippingOptions[store.id] || [];
      const currentOption = opts.find((s) => s.id === optionId);
      const maxKm = currentOption?.maxKm;
      const distInfo = storeDistances[store.id];
      return maxKm != null && distInfo?.distance != null && distInfo.distance > maxKm;
    });
  }, [stores, selectedShipping, storeShippingOptions, storeDistances]);

  const handleConfirm = async () => {
    if (loading) return;
    if (isAnyStoreOutOfRange) {
      alert("Ada pengiriman yang berada di luar jangkauan radius layanan toko. Harap ubah metode pengiriman atau alamat Anda.");
      return;
    }
    setLoading(true);
    try {
      // Build shippingDetails untuk disimpan di orders
      const shippingDetails: Record<string, { method: string; ratePerKm?: number; distanceKm?: number }> = {};
      stores.forEach((store) => {
        const method = selectedShipping[store.id] || "gosend";
        const dist = storeDistances[store.id]?.distance;
        shippingDetails[store.id] = {
          method,
          ...(method === "penjual" && {
            ratePerKm: store.pricePerKm ?? 3000,
            distanceKm: dist ?? undefined,
          }),
        };
      });

      const result = await checkoutCart(storeShippingCosts, notes, selectedItemIds, selectedAddressId, shippingDetails);
      if (result.error) {
        alert(result.error);
        setLoading(false);
        return;
      }
      alert("Pesanan Berhasil Dibuat! Anda akan diarahkan ke halaman pesanan.");
      router.push("/orders");
      router.refresh();
    } catch {
      alert("Terjadi kesalahan.");
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cart" className="inline-flex items-center text-gray-400 hover:text-[#407BB5]">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Checkout</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-start">
        {/* KIRI - Alamat & Per Toko Shipping Selection */}
        <div className="space-y-4">
          {/* Pilih Alamat Card — Card sekaligus Dropdown */}
          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-gray-800 text-lg border-b pb-3 flex items-center gap-2">
              <MapPin size={18} className="text-primary" /> Alamat Pengiriman
            </h2>

            <div className="relative">
              {/* Card utama yang sekaligus jadi tombol dropdown */}
              <button
                type="button"
                onClick={() => setAddressDropdownOpen((prev) => !prev)}
                className="w-full text-left border border-primary/30 rounded-xl p-4 bg-primary/5 space-y-1 text-sm hover:border-primary/60 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {selectedAddress ? (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800 flex items-center gap-2">
                        {selectedAddress.label}
                        {selectedAddress.is_primary && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-white font-medium">
                            Utama
                          </span>
                        )}
                      </p>
                      <ChevronDown
                        size={16}
                        className={`text-primary transition-transform duration-200 ${
                          addressDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    <p className="font-medium text-gray-800">{selectedAddress.recipient_name}</p>
                    <p className="text-gray-500">{selectedAddress.phone}</p>
                    <p className="text-gray-500">{selectedAddress.address}</p>
                  </>
                ) : (
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Pilih alamat pengiriman</span>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${addressDropdownOpen ? "rotate-180" : ""}`} />
                  </div>
                )}
              </button>

              {/* Dropdown list alamat lainnya */}
              {addressDropdownOpen && (
                <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => {
                        setSelectedAddressId(addr.id);
                        setAddressDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-primary/5 border-b last:border-0 border-gray-100 ${
                        selectedAddressId === addr.id ? "bg-primary/10" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-800 flex items-center gap-2">
                          {addr.label}
                          {addr.is_primary && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-white font-medium">
                              Utama
                            </span>
                          )}
                        </p>
                        {selectedAddressId === addr.id && (
                          <CheckCircle size={14} className="text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-gray-600 text-xs mt-0.5">{addr.recipient_name} · {addr.phone}</p>
                      <p className="text-gray-400 text-xs truncate">{addr.address}</p>
                    </button>
                  ))}
                  <a
                    href={`/profile/edit?redirect=${encodeURIComponent(`/checkout?items=${(selectedItemIds || []).join(",")}`)}`}
                    className="block px-4 py-3 text-xs text-primary font-medium hover:bg-primary/5 transition-colors"
                  >
                    + Ubah / Tambah Alamat
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Grouped Items & Shipping Selector per Store */}
          {stores.map((store) => {
            const storeItems = itemsByStore[store.id] || [];
            const shippingOptionId = selectedShipping[store.id] || storeShippingOptions[store.id]?.[0]?.id;
            const distInfo = storeDistances[store.id] || { distance: null, loading: false, failed: false };


            return (
              <div key={store.id} className="card p-6 space-y-4 border border-gray-100">
                {/* Store Header */}
                <div className="flex items-center gap-2 border-b pb-3">
                  <Store className="text-primary" size={18} />
                  <h3 className="font-bold text-gray-800">{store.name}</h3>
                </div>

                {/* Store Items List */}
                <div className="space-y-3">
                  {storeItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-sm">
                      <div className="flex-1 pr-4">
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-400">Jumlah: {item.qty}</p>
                      </div>
                      <span className="font-semibold text-gray-800 shrink-0">
                        {formatPrice(item.price * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Dynamic Store Distance Warnings */}
                {store.address && !store.lat && (
                  <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                    Koordinat toko tidak dapat diverifikasi. Validasi jarak dinamis tidak aktif.
                  </p>
                )}

                {/* Shipping Selection for this Store */}
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Navigation size={12} className="text-primary" /> Pengiriman Toko
                  </p>
                  <div className="grid gap-2">
                    {(storeShippingOptions[store.id] || []).map((opt) => {
                      const isSelected = shippingOptionId === opt.id;
                      // Hitung harga tampilan untuk label di radio
                      const dist = storeDistances[store.id]?.distance;
                      const isPenjual = opt.id === "penjual";
                      const computedPrice = isPenjual && dist != null
                        ? Math.round(dist * (store.pricePerKm ?? 3000))
                        : null;

                      return (
                        <label
                          key={opt.id}
                          className={`flex items-center justify-between border rounded-xl px-3 py-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`shipping-${store.id}`}
                              value={opt.id}
                              checked={isSelected}
                              onChange={() =>
                                setSelectedShipping((prev) => ({
                                  ...prev,
                                  [store.id]: opt.id,
                                }))
                              }
                              className="accent-primary"
                            />
                            <span className={isSelected ? "text-primary" : "text-gray-400"}>
                              {SHIPPING_ICONS[opt.id] ?? <Truck size={16} />}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-gray-800">{opt.label}</p>
                              <p className="text-[10px] text-gray-500 leading-tight">{opt.desc}</p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-primary shrink-0">
                            {isPenjual
                              ? computedPrice != null
                                ? formatPrice(computedPrice)
                                : `Rp${(store.pricePerKm ?? 3000).toLocaleString("id-ID")}/km`
                              : "Gratis"}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Store Distance geocoding & validations */}
                {(() => {
                  const optId = selectedShipping[store.id] || storeShippingOptions[store.id]?.[0]?.id;
                  const opts = storeShippingOptions[store.id] || [];
                  const curOpt = opts.find((s) => s.id === optId);
                  const maxKm = curOpt?.maxKm;
                  const isOut = maxKm != null && distInfo.distance != null && distInfo.distance > maxKm;
                  const isPenjual = optId === "penjual";

                  return maxKm ? (
                    <div className="mt-1 space-y-1">
                      {distInfo.loading && (
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                          <Loader2 size={12} className="animate-spin" />
                          Mengecek jarak ke toko...
                        </div>
                      )}

                      {!distInfo.loading && distInfo.failed && (
                        <div className="flex items-center gap-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                          <AlertTriangle size={12} />
                          Gagal memverifikasi jarak pengiriman.
                        </div>
                      )}

                      {!distInfo.loading && distInfo.distance !== null && !isOut && (
                        <div className="flex items-center gap-2 text-[10px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                          <CheckCircle size={12} />
                          Jarak toko ke alamat ±{distInfo.distance} km — dalam radius layanan ✓
                        </div>
                      )}

                      {/* Detail kalkulasi tarif penjual */}
                      {!distInfo.loading && isPenjual && distInfo.distance !== null && !isOut && (
                        <div className="flex items-center gap-2 text-[10px] text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                          <Truck size={12} />
                          Rp{(store.pricePerKm ?? 3000).toLocaleString("id-ID")}/km × {distInfo.distance} km
                          {" = "}
                          <span className="font-bold">{formatPrice(Math.round(distInfo.distance * (store.pricePerKm ?? 3000)))}</span>
                        </div>
                      )}

                      {!distInfo.loading && isOut && (
                        <div className="flex items-center gap-2 text-[10px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                          <AlertTriangle size={12} />
                          Alamat terlalu jauh ({distInfo.distance} km). Batas maks {maxKm} km.
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}

                {/* Catatan per Toko */}
                <div className="mt-4 pt-4 border-t">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Catatan untuk {store.name} (opsional)
                  </label>
                  <input
                    type="text"
                    value={notes[store.id] || ""}
                    onChange={(e) =>
                      setNotes((prev) => ({
                        ...prev,
                        [store.id]: e.target.value,
                      }))
                    }
                    placeholder="Misal: taruh di depan pintu, request khusus..."
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* KANAN - Summary, QRIS, & Confirmation */}
        <div className="space-y-4">
          {/* Detailed Summary Card */}
          <div className="card p-5">
            <h2 className="font-bold text-gray-800 mb-3 border-b pb-2 flex items-center gap-2">
              <ClipboardList size={18} className="text-primary" /> Ringkasan Pesanan
            </h2>
            <div className="space-y-3">
              {/* Product Subtotals per Store */}
              {stores.map((store) => {
                const sub = storeSubtotals[store.id] || 0;
                const ship = storeShippingCosts[store.id] || 0;
                const methodId = selectedShipping[store.id];
                const dist = storeDistances[store.id]?.distance;
                const isPenjual = methodId === "penjual";

                return (
                  <div key={store.id} className="text-xs space-y-1 border-b pb-2 last:border-0 last:pb-0">
                    <p className="font-bold text-gray-700">{store.name}</p>
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal Produk</span>
                      <span>{formatPrice(sub)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Ongkir Toko</span>
                      <span>{formatPrice(ship)}</span>
                    </div>
                    {/* Detail tarif per km untuk pengiriman penjual */}
                    {isPenjual && dist != null && (
                      <div className="flex justify-between text-blue-500 text-[10px]">
                        <span>
                          Rp{(store.pricePerKm ?? 3000).toLocaleString("id-ID")}/km × {dist} km
                        </span>
                        <span>{formatPrice(Math.round(dist * (store.pricePerKm ?? 3000)))}</span>
                      </div>
                    )}
                    {isPenjual && dist == null && (
                      <p className="text-[10px] text-amber-600">Pilih alamat untuk menghitung ongkir</p>
                    )}
                  </div>
                );
              })}

              <div className="space-y-1.5 pt-2 text-xs border-t">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal Produk (Semua)</span>
                  <span>{formatPrice(productSubtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Total Ongkos Kirim</span>
                  <span>{formatPrice(totalShipping)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Biaya Admin</span>
                  <span>{formatPrice(biayaAdmin)}</span>
                </div>
                <div className="flex justify-between font-bold text-primary text-base pt-2 border-t">
                  <span>Total Bayar</span>
                  <span>{formatPrice(totalPay)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* QRIS Payment Card */}
          <div className="card p-5 text-center">
            <h2 className="font-bold text-gray-800 mb-3 flex items-center justify-center gap-2">
              <CreditCard size={18} className="text-primary" /> Pembayaran QRIS
            </h2>
            <div className="bg-gray-100 rounded-xl w-40 h-40 mx-auto flex items-center justify-center mb-3 border-2 border-dashed border-gray-300">
              <Smartphone size={48} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-1">
              Scan QR Code dengan e-wallet atau mobile banking
            </p>
            <p className="font-bold text-primary text-lg">{formatPrice(totalPay)}</p>
            <p className="text-xs text-gray-400 mt-1">Berlaku 15 menit</p>
          </div>

          {/* Checkout Button */}
          <div>
            <button
              onClick={handleConfirm}
              disabled={loading || isAnyStoreOutOfRange}
              className="btn-primary w-full py-3 rounded-xl text-base disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              {loading ? "Memproses..." : "Sudah Scan, Konfirmasi Pembayaran"}
            </button>
            {isAnyStoreOutOfRange && (
              <p className="text-xs text-center text-red-500 mt-1.5">
                Ada pengiriman toko di luar radius layanan. Harap ubah metode pengiriman toko tersebut.
              </p>
            )}
            <p className="text-xs text-center text-gray-400 mt-2">
              Karena ini versi demo, konfirmasi akan langsung berhasil dan mengosongkan keranjang.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}