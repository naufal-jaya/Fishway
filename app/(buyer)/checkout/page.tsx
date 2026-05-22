import Container from "@/components/Container";
import { formatPrice } from "@/lib/data";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CheckoutClient from "@/components/CheckoutClient";

export default async function CheckoutPage() {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  // Fetch account & buyer info
  const [{ data: account }, { data: buyer }] = await Promise.all([
    supabase.from("accounts").select("name, address").eq("id", user.id).maybeSingle(),
    supabase.from("buyers").select("phone").eq("id", user.id).maybeSingle()
  ]);

  // Fetch addresses
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

  // Fetch Cart
  const { data: cart } = await supabase
    .from("carts")
    .select(`
      id,
      cart_items (
        id,
        quantity,
        products (
          id, name, type, price, unit
        ),
        price_options (
          id, label, price
        )
      )
    `)
    .eq("buyer_id", user.id)
    .maybeSingle();

  const cartItems = cart?.cart_items || [];
  
  if (cartItems.length === 0) {
    redirect("/cart");
  }

  let subtotal = 0;
  
  const formattedItems = cartItems.map((item: any) => {
    const product = item.products;
    const variant = item.price_options;
    
    const itemPrice = product?.type === 0 ? product.price : variant?.price || 0;
    
    subtotal += itemPrice * item.quantity;

    return {
      id: item.id,
      name: product?.name || "Produk",
      qty: item.quantity,
      price: itemPrice,
    };
  });

  const shipping = 15000;
  const total = subtotal + shipping;

  return (
    <div>
      <Navbar />
      <Container>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-start">

          {/* KIRI — Detail Pemesan (memanjang sejajar kanan) */}
          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-gray-800 text-lg border-b pb-3">
              👤 Detail Pemesan
            </h2>

            {addresses.length === 0 ? (
              <p className="text-sm text-gray-500">
                Belum ada alamat tersimpan.{" "}
                <a href="/profile/edit" className="text-primary hover:underline">Tambah alamat</a>
              </p>
            ) : (
              <CheckoutClient
                addresses={addresses}
                defaultName={account?.name || ""}
                defaultPhone={buyer?.phone || ""}
              />
            )}
          </div>

          {/* KANAN — Pesanan + QRIS + Tombol Konfirmasi */}
          <div className="space-y-4">
            {/* Order Summary */}
            <div className="card p-5">
              <h2 className="font-bold text-gray-800 mb-3 border-b pb-2">
                🧾 Pesanan
              </h2>
              <div className="space-y-2">
                {formattedItems.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name} x{item.qty}</span>
                    <span className="font-medium">{formatPrice(item.price * item.qty)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm text-gray-500 pt-2">
                  <span>Ongkos Kirim</span>
                  <span>{formatPrice(shipping)}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-primary text-base">
                  <span>Total Bayar</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* QRIS Payment */}
            <div className="card p-5 text-center">
              <h2 className="font-bold text-gray-800 mb-3">💳 Pembayaran QRIS</h2>
              <div className="bg-gray-100 rounded-xl w-40 h-40 mx-auto flex items-center justify-center mb-3 border-2 border-dashed border-gray-300">
                <span className="text-4xl">📱</span>
              </div>
              <p className="text-sm text-gray-500 mb-1">
                Scan QR Code dengan e-wallet atau mobile banking
              </p>
              <p className="font-bold text-primary text-lg">{formatPrice(total)}</p>
              <p className="text-xs text-gray-400 mt-1">Berlaku 15 menit</p>
            </div>

            {/* Tombol konfirmasi di bawah QRIS */}
            <CheckoutClient confirmOnly />
          </div>

        </div>
      </Container>
    </div>
  );
}