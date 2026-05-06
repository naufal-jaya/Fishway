import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Container from "@/components/Container";
import { createClient } from "@/utils/supabase/server";
import { formatPrice } from "@/lib/data";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import CartItemControl from "@/components/CartItemControl";

export default async function CartPage() {
  const supabase = createClient(cookies());

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/"); // Or redirect to login
  }

  // Fetch the active cart for the user
  const { data: cart } = await supabase
    .from("carts")
    .select(`
      id,
      cart_items (
        id,
        quantity,
        products (
          id, name, type, price, unit, gambar, location,
          stores (name)
        ),
        price_options (
          id, label, price
        )
      )
    `)
    .eq("buyer_id", user.id)
    .maybeSingle();

  const cartItems = cart?.cart_items || [];

  let subtotal = 0;
  
  const formattedItems = cartItems.map((item: any) => {
    const product = item.products;
    const variant = item.price_options;
    
    const itemPrice = product?.type === 0 ? product.price : variant?.price || 0;
    const itemUnit = product?.type === 0 ? product.unit : variant?.label || "unit";
    
    subtotal += itemPrice * item.quantity;

    return {
      id: item.id,
      productId: product?.id,
      name: product?.name || "Produk Tidak Ditemukan",
      seller: product?.stores?.name || "Penjual",
      location: product?.location || "-",
      gambar: product?.gambar || "/images/default.png",
      qty: item.quantity,
      price: itemPrice,
      unit: itemUnit,
    };
  });

  const ongkir = 15000;
  const total = subtotal + ongkir;

  return (
    <div>
      <Navbar />
      <Container>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          🛒 Keranjang Belanja
        </h1>

        {formattedItems.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-5xl mb-4">🛒</p>
            <p className="text-gray-500 mb-4">Keranjang kamu kosong</p>
            <Link href="/" className="btn-primary inline-block">
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Item List */}
            <div className="md:col-span-2 space-y-3">
              {formattedItems.map((item: any) => (
                <div key={item.id} className="card p-4 flex gap-4 items-center">
                  {/* Image */}
                  <div className="bg-blue-50 w-16 h-16 rounded-lg flex items-center justify-center text-3xl flex-shrink-0 relative overflow-hidden">
                    <Image 
                      src={item.gambar || "/images/default.png"} 
                      alt={item.name || "Product"} 
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {item.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.seller} · {item.location}
                    </p>
                    <p className="text-primary font-bold mt-1">
                      {formatPrice(item.price)}/
                      {item.unit}
                    </p>
                  </div>
                  {/* Qty Control and Remove */}
                  <CartItemControl itemId={item.id} initialQty={item.qty} />
                  
                  {/* Subtotal */}
                  <div className="text-right flex-shrink-0 min-w-[80px]">
                    <p className="font-bold text-gray-800">
                      {formatPrice(item.price * item.qty)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div>
              <div className="card p-5 space-y-3 sticky top-20">
                <h2 className="font-bold text-gray-800 text-lg">
                  Ringkasan Pesanan
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({formattedItems.length} item)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Ongkos Kirim</span>
                    <span>{formatPrice(ongkir)}</span>
                  </div>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-gray-800">
                  <span>Total</span>
                  <span className="text-primary text-lg">
                    {formatPrice(total)}
                  </span>
                </div>
                <Link
                  href="/checkout"
                  className="btn-primary w-full text-center block py-3 rounded-xl"
                >
                  Lanjut ke Checkout →
                </Link>
                <Link
                  href="/"
                  className="text-sm text-center text-primary block hover:underline"
                >
                  + Tambah Produk
                </Link>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
