import Container from "@/components/Container";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CheckoutClient from "@/components/CheckoutClient";

/** Geocode alamat teks → koordinat via Nominatim (server-side) */
async function geocodeServerSide(
  address: string
): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        address + ", Indonesia"
      )}&format=json&limit=1`,
      {
        headers: { "User-Agent": "FishWay-App/1.0" },
        next: { revalidate: 3600 }, // cache 1 jam
      }
    );
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
  } catch { }
  return null;
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { items?: string };
}) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  // Fetch addresses pembeli
  const { data: addressesData } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });

  const addresses = (addressesData || []) as {
    id: string;
    label: string;
    recipient_name: string;
    phone: string;
    address: string;
    is_primary: boolean;
  }[];

  // Fetch Cart (sertakan store_id dari products)
  const { data: cart } = await supabase
    .from("carts")
    .select(`
      id,
      cart_items (
        id,
        quantity,
        products (
          id, name, type, price, unit, store_id
        ),
        price_options (
          id, label, price
        )
      )
    `)
    .eq("buyer_id", user.id)
    .maybeSingle();

  const cartItems = cart?.cart_items || [];

  // Filter berdasarkan item IDs yang dipilih dari keranjang (?items=id1,id2,...)
  const selectedIdsParam = searchParams.items || "";
  const selectedIds = selectedIdsParam
    ? new Set(selectedIdsParam.split(",").map((s) => s.trim()).filter(Boolean))
    : null;

  // Kalau tidak ada filter (user akses /checkout langsung tanpa dari keranjang), redirect ke cart
  if (!selectedIds || selectedIds.size === 0) {
    redirect("/cart");
  }

  const filteredItems = selectedIds
    ? cartItems.filter((item: any) => selectedIds.has(item.id))
    : cartItems;

  if (filteredItems.length === 0) {
    redirect("/cart");
  }

  // Kumpulkan ID cart items yang akan di-checkout (untuk dihapus dari keranjang setelah checkout)
  const selectedItemIdsList = filteredItems.map((item: any) => item.id);

  const formattedItems = filteredItems.map((item: any) => {
    const product = Array.isArray(item.products) ? item.products[0] : item.products;
    const variant = Array.isArray(item.price_options) ? item.price_options[0] : item.price_options;

    const itemPrice = product?.type === 0 ? product.price : variant?.price || 0;
    const storeId = product?.store_id;

    return {
      id: item.id,
      name: product?.name || "Produk",
      qty: item.quantity,
      price: itemPrice,
      storeId,
    };
  });

  // Get unique store IDs from items
  const uniqueStoreIds = Array.from(new Set(formattedItems.map(item => item.storeId).filter(Boolean))) as string[];

  // Fetch store details (name, address) for these store IDs
  const storesData = [];
  if (uniqueStoreIds.length > 0) {
    const { data } = await supabase
      .from("stores")
      .select("id, name, address")
      .in("id", uniqueStoreIds);
    if (data) {
      storesData.push(...data);
    }
  }

  // Geocode all store addresses on the server
  const stores = await Promise.all(
    storesData.map(async (store) => {
      let lat: number | undefined;
      let lon: number | undefined;
      if (store.address) {
        const coords = await geocodeServerSide(store.address);
        if (coords) {
          lat = coords.lat;
          lon = coords.lon;
        }
      }
      return {
        id: store.id,
        name: store.name,
        address: store.address,
        lat,
        lon,
      };
    })
  );

  const SHIPPING_OPTIONS = [
    { id: "gosend", label: "GoSend", price: 0, desc: "Ongkir dibayar terpisah", maxKm: 10 },
    { id: "ambil", label: "Ambil Sendiri", price: 0, desc: "Ambil langsung ke toko" },
    { id: "penjual", label: "Dianterin Penjual", price: 15000, desc: "Dikirim langsung oleh penjual", maxKm: 10 },
  ];

  return (
    <div>
      <Navbar />
      <Container>
        <CheckoutClient
          addresses={addresses}
          items={formattedItems}
          stores={stores}
          shippingOptions={SHIPPING_OPTIONS}
          selectedItemIds={selectedItemIdsList}
        />
      </Container>
    </div>
  );
}