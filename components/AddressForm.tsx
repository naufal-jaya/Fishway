"use client";

import { useState, useCallback, useRef } from "react";
import { addAddress, updateAddress } from "@/lib/addresses";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { MapPin, Search } from "lucide-react";

type Address = {
  id?: string;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  lat?: number | null;
  lon?: number | null;
  is_primary: boolean;
};

const mapContainerStyle = {
  width: "100%",
  height: "200px",
  borderRadius: "0.5rem",
};

// Default center: Jakarta
const defaultCenter = { lat: -6.2088, lng: 106.8456 };

export default function AddressForm({
  existing,
  onClose,
}: {
  existing?: Address;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Address>(
    existing || { label: "", recipient_name: "", phone: "", address: "", is_primary: false, lat: null, lon: null }
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; recipient_name?: string }>({});

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  const [mapCenter, setMapCenter] = useState(
    existing?.lat && existing?.lon
      ? { lat: existing.lat, lng: existing.lon }
      : defaultCenter
  );
  const [markerPosition, setMarkerPosition] = useState(
    existing?.lat && existing?.lon
      ? { lat: existing.lat, lng: existing.lon }
      : defaultCenter
  );

  const {
    ready,
    value: searchValue,
    suggestions: { status, data },
    setValue: setSearchValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: "id" }, // Batasi ke Indonesia
    },
    debounce: 300,
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoadMap = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const reverseGeocode = (lat: number, lng: number) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        setForm((prev) => ({
          ...prev,
          address: results[0].formatted_address,
          lat,
          lon: lng,
        }));
        setSearchValue(results[0].formatted_address, false);
      }
    });
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      reverseGeocode(lat, lng);
    }
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
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
      setForm((prev) => ({
        ...prev,
        address: addressStr,
        lat,
        lon: lng,
      }));
    } catch (error) {
      console.error("Error fetching geocode", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { phone?: string; recipient_name?: string } = {};

    if (!form.recipient_name.trim()) {
      newErrors.recipient_name = "Nama penerima tidak boleh kosong.";
    } else if (/\d/.test(form.recipient_name)) {
      newErrors.recipient_name = "Nama tidak boleh mengandung angka.";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Nomor telepon tidak boleh kosong.";
    } else if (!/^(\+62|62|0)[0-9]{8,12}$/.test(form.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Nomor tidak valid. Contoh: 08123456789";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const dataToSave = {
      label: form.label,
      recipient_name: form.recipient_name,
      phone: form.phone,
      address: form.address,
      is_primary: form.is_primary,
      lat: form.lat ?? undefined,
      lon: form.lon ?? undefined,
    };

    if (existing?.id) {
      await updateAddress(existing.id, dataToSave);
    } else {
      await addAddress(dataToSave);
    }
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
        <h2 className="font-bold text-gray-800 text-lg">{existing ? "Edit Alamat" : "Tambah Alamat"}</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Label (contoh: Rumah, Kantor)</label>
            <input required name="label" value={form.label} onChange={handleChange} className="w-full border rounded-lg p-2 mt-1 text-sm" placeholder="Rumah" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Nama Penerima</label>
              <input
                required
                name="recipient_name"
                value={form.recipient_name}
                onChange={(e) => {
                  handleChange(e);
                  setErrors((prev) => ({ ...prev, recipient_name: undefined }));
                }}
                className={`w-full border rounded-lg p-2 mt-1 text-sm ${errors.recipient_name ? "border-red-400" : ""}`}
              />
              {errors.recipient_name && <p className="text-xs text-red-500 mt-1">{errors.recipient_name}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Nomor Telepon</label>
              <input
                required
                name="phone"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9+]/g, "");
                  setForm({ ...form, phone: val });
                  setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                className={`w-full border rounded-lg p-2 mt-1 text-sm ${errors.phone ? "border-red-400" : ""}`}
                placeholder="08123456789"
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
          </div>

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
                      className="w-full border rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                  {/* Suggestions Dropdown */}
                  {status === "OK" && (
                    <ul className="absolute bg-white border rounded-lg shadow-lg mt-1 w-full max-h-40 overflow-auto z-20 text-sm">
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
                    <MapPin className="w-3 h-3 inline mr-1 text-[#407BB5]" />
                    Geser pin atau klik peta untuk atur lokasi pasti
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-[200px] bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-500 animate-pulse">
                Memuat peta...
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block">Detail Alamat</label>
            <textarea
              required
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={2}
              className="w-full border rounded-lg p-2 mt-1 text-sm bg-gray-50"
              placeholder="Detail jalan, RT/RW, nomor rumah..."
            />
            {form.lat && form.lon && (
              <p className="text-[10px] text-gray-400 mt-1">Koordinat: {form.lat.toFixed(6)}, {form.lon.toFixed(6)}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_primary" checked={form.is_primary} onChange={(e) => setForm({ ...form, is_primary: e.target.checked })} />
            <label htmlFor="is_primary" className="text-sm text-gray-700">Jadikan alamat utama</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline py-2 rounded-xl text-sm">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary py-2 rounded-xl text-sm">
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}