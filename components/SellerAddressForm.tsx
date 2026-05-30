"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/supabaseClient";
import { MapPin, Pencil, Check, X, AlertCircle, Search, Truck } from "lucide-react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";

const mapContainerStyle = {
  width: "100%",
  height: "250px",
  borderRadius: "0.5rem",
};

// Default center: Jakarta
const defaultCenter = { lat: -6.2088, lng: 106.8456 };

export default function SellerAddressForm() {
  const supabase = createClient();

  const [storeId, setStoreId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [maxDistance, setMaxDistance] = useState<number | null>(10); // default

  // Shipping methods state
  const [shippingOjol, setShippingOjol] = useState(true);
  const [shippingAmbil, setShippingAmbil] = useState(true);
  const [shippingPenjual, setShippingPenjual] = useState(true);

  const [draft, setDraft] = useState("");
  const [draftLat, setDraftLat] = useState<number | null>(null);
  const [draftLon, setDraftLon] = useState<number | null>(null);
  const [draftMaxDistance, setDraftMaxDistance] = useState<number | null>(10);
  
  const [draftShippingOjol, setDraftShippingOjol] = useState(true);
  const [draftShippingAmbil, setDraftShippingAmbil] = useState(true);
  const [draftShippingPenjual, setDraftShippingPenjual] = useState(true);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);

  const {
    ready,
    value: searchValue,
    suggestions: { status, data },
    setValue: setSearchValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: "id" },
    },
    debounce: 300,
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoadMap = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  useEffect(() => {
    async function fetchStoreAddress() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: store, error } = await supabase
        .from("stores")
        .select("id, address, lat, lon, max_distance, shipping_ojol, shipping_ambil, shipping_penjual")
        .eq("seller_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching store address:", error.message);
      }

      if (store) {
        setStoreId(store.id);
        setAddress(store.address || "");
        setLat(store.lat);
        setLon(store.lon);
        
        // If max_distance exists, use it, else default 10
        const md = store.max_distance != null ? store.max_distance : 10;
        setMaxDistance(md);
        
        // Shipping methods
        setShippingOjol(store.shipping_ojol ?? true);
        setShippingAmbil(store.shipping_ambil ?? true);
        setShippingPenjual(store.shipping_penjual ?? true);

        if (store.lat && store.lon) {
          const center = { lat: store.lat, lng: store.lon };
          setMapCenter(center);
          setMarkerPosition(center);
        }
      }
      setFetching(false);
    }
    fetchStoreAddress();
  }, [supabase]);

  const reverseGeocode = (lat: number, lng: number) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        setDraft(results[0].formatted_address);
        setSearchValue(results[0].formatted_address, false);
      }
    });
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      setDraftLat(lat);
      setDraftLon(lng);
      reverseGeocode(lat, lng);
    }
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      setDraftLat(lat);
      setDraftLon(lng);
      reverseGeocode(lat, lng);
    }
  };

  const handleSelectPlace = async (addressStr: string) => {
    setSearchValue(addressStr, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address: addressStr });
      const { lat, lng } = await getLatLng(results[0]);
      setMapCenter({ lat, lng });
      setMarkerPosition({ lat, lng });
      setDraft(addressStr);
      setDraftLat(lat);
      setDraftLon(lng);
    } catch (err) {
      console.error("Error fetching geocode", err);
    }
  };

  const startEditing = () => {
    setDraft(address);
    setDraftLat(lat);
    setDraftLon(lon);
    setDraftMaxDistance(maxDistance);
    
    setDraftShippingOjol(shippingOjol);
    setDraftShippingAmbil(shippingAmbil);
    setDraftShippingPenjual(shippingPenjual);

    if (lat && lon) {
      const center = { lat, lng: lon };
      setMapCenter(center);
      setMarkerPosition(center);
    } else {
      setMapCenter(defaultCenter);
      setMarkerPosition(defaultCenter);
    }
    setSearchValue(address, false);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!draft.trim()) {
      setError("Alamat toko tidak boleh kosong.");
      return;
    }
    if (!draftLat || !draftLon) {
      setError("Harap tentukan lokasi di peta untuk menyimpan koordinat.");
      return;
    }
    if (draftMaxDistance == null || draftMaxDistance < 1) {
      setError("Jarak maksimal pengiriman minimal 1 km.");
      return;
    }
    if (!draftShippingOjol && !draftShippingAmbil && !draftShippingPenjual) {
      setError("Minimal satu metode pengiriman harus diaktifkan.");
      return;
    }
    if (!storeId) return;
    setError("");
    setLoading(true);

    const { error: dbError } = await supabase
      .from("stores")
      .update({ 
        address: draft.trim(), 
        lat: draftLat, 
        lon: draftLon,
        max_distance: draftMaxDistance,
        shipping_ojol: draftShippingOjol,
        shipping_ambil: draftShippingAmbil,
        shipping_penjual: draftShippingPenjual,
      })
      .eq("id", storeId);

    if (dbError) {
      setError("Gagal menyimpan: " + dbError.message);
    } else {
      setAddress(draft.trim());
      setLat(draftLat);
      setLon(draftLon);
      setMaxDistance(draftMaxDistance);
      
      setShippingOjol(draftShippingOjol);
      setShippingAmbil(draftShippingAmbil);
      setShippingPenjual(draftShippingPenjual);
      
      setEditing(false);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setDraft(address);
    setDraftLat(lat);
    setDraftLon(lon);
    setDraftMaxDistance(maxDistance);
    
    setDraftShippingOjol(shippingOjol);
    setDraftShippingAmbil(shippingAmbil);
    setDraftShippingPenjual(shippingPenjual);
    
    setError("");
    setEditing(false);
  };

  if (fetching) return null;
  if (!storeId) return null;

  return (
    <div className="card p-5 space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-3">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <MapPin size={18} className="text-primary" />
          Alamat Toko & Pengiriman
        </h2>
        {!editing && (
          <button
            onClick={startEditing}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Pencil size={14} /> Edit
          </button>
        )}
      </div>

      {/* Warning jika alamat kosong */}
      {(!address || !lat || !lon) && !editing && (
        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>
            Alamat toko belum lengkap (butuh lokasi peta). Pembeli tidak bisa mengetahui jarak ke toko Anda.
            <button
              onClick={startEditing}
              className="ml-1 underline font-medium"
            >
              Isi sekarang
            </button>
          </span>
        </div>
      )}

      {/* Tampilan alamat */}
      {!editing && address && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2">
          <p className="text-sm text-gray-700 leading-relaxed">
            {address}
          </p>
          {lat && lon && (
            <div className="flex flex-col gap-1 mt-2 border-t pt-2 border-gray-200">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={12} />
                <span>Koordinat tersimpan: {lat.toFixed(6)}, {lon.toFixed(6)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Truck size={12} />
                <span>Jarak Maksimal Pengiriman: {maxDistance} km</span>
              </div>
              <div className="mt-1 pt-1 border-t border-gray-100 flex flex-wrap gap-2">
                {shippingOjol && (
                  <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">Ojol</span>
                )}
                {shippingAmbil && (
                  <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">Ambil Sendiri</span>
                )}
                {shippingPenjual && (
                  <span className="text-[10px] bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-medium">Dianterin Penjual</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form edit */}
      {editing && (
        <div className="space-y-4 pt-2">
          {/* Max Distance */}
          <div>
             <label className="text-sm font-medium text-gray-700 block mb-1">Jarak Maksimal Pengiriman (km)</label>
             <input 
               type="number"
               min="1"
               step="1"
               value={draftMaxDistance || ""}
               onChange={(e) => setDraftMaxDistance(parseInt(e.target.value) || null)}
               className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-primary"
               placeholder="Contoh: 10"
             />
             <p className="text-xs text-gray-500 mt-1">Pembeli yang berlokasi di luar jarak ini tidak bisa melakukan checkout dari toko Anda.</p>
          </div>
          
          {/* Shipping Methods Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Metode Pengiriman yang Tersedia</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer border p-2 rounded-lg border-gray-200 hover:bg-gray-50">
                <input 
                  type="checkbox" 
                  checked={draftShippingOjol}
                  onChange={(e) => setDraftShippingOjol(e.target.checked)}
                  className="accent-primary w-4 h-4" 
                />
                <span className="text-sm text-gray-700 font-medium">Ojol (GoSend, GrabExpress, dll.)</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer border p-2 rounded-lg border-gray-200 hover:bg-gray-50">
                <input 
                  type="checkbox" 
                  checked={draftShippingAmbil}
                  onChange={(e) => setDraftShippingAmbil(e.target.checked)}
                  className="accent-primary w-4 h-4" 
                />
                <span className="text-sm text-gray-700 font-medium">Ambil Sendiri ke Toko</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer border p-2 rounded-lg border-gray-200 hover:bg-gray-50">
                <input 
                  type="checkbox" 
                  checked={draftShippingPenjual}
                  onChange={(e) => setDraftShippingPenjual(e.target.checked)}
                  className="accent-primary w-4 h-4" 
                />
                <span className="text-sm text-gray-700 font-medium">Dianterin Langsung oleh Penjual</span>
              </label>
            </div>
          </div>

          {/* Map Integration */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Tentukan Lokasi di Peta</label>
            {isLoaded ? (
              <div className="space-y-2 relative">
                {/* Search Bar */}
                <div className="relative z-10">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3" />
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      disabled={!ready}
                      placeholder="Cari lokasi jalan/gedung..."
                      className="w-full border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  {/* Suggestions Dropdown */}
                  {status === "OK" && (
                    <ul className="absolute bg-white border border-gray-200 rounded-lg shadow-lg mt-1 w-full max-h-40 overflow-auto z-20 text-sm">
                      {data.map(({ place_id, description }) => (
                        <li
                          key={place_id}
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-start gap-2"
                          onClick={() => handleSelectPlace(description)}
                        >
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="truncate">{description}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="border rounded-lg overflow-hidden relative">
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    zoom={15}
                    center={mapCenter}
                    onClick={handleMapClick}
                    onLoad={onLoadMap}
                    options={{
                      disableDefaultUI: true,
                      zoomControl: true,
                    }}
                  >
                    <Marker
                      position={markerPosition}
                      draggable={true}
                      onDragEnd={handleMarkerDragEnd}
                    />
                  </GoogleMap>
                  <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur text-xs p-2 rounded shadow-sm text-gray-600">
                    <MapPin className="w-3 h-3 inline mr-1 text-primary" />
                    Geser pin atau klik peta untuk atur lokasi pasti
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-[250px] bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-500 animate-pulse">
                Memuat peta...
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Detail Alamat</label>
            <textarea
              rows={2}
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setError(""); }}
              placeholder="Masukkan detail alamat, misal: Jl. Raya No. 1, RT 01/02..."
              className={`w-full border rounded-lg p-2 text-sm outline-none focus:border-primary resize-none ${
                error ? "border-red-400" : "border-gray-300"
              }`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <button
              onClick={handleCancel}
              className="flex-1 btn-outline py-2 rounded-xl text-sm flex items-center justify-center gap-1"
            >
              <X size={14} /> Batal
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !draftLat || !draftLon}
              className="flex-1 btn-primary py-2 rounded-xl text-sm flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <Check size={14} />
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
