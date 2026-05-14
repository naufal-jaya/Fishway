import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Container from "@/components/Container";
import { createClient } from "@/utils/supabase/server";
import { formatPrice } from "@/lib/data";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import CartItemControl from "@/components/CartItemControl";
import CartCheckbox from "@/components/CartCheckbox";

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

  const biayaAdmin = 2000;
  const total = subtotal + biayaAdmin;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
      <Container>
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="inline-flex items-center text-gray-400 hover:text-[#407BB5]">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Keranjang</h1>
        </div>

        {formattedItems.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-5xl mb-4">🛒</p>
            <p className="text-gray-500 mb-4">Keranjang kamu kosong</p>
            <Link href="/" className="btn-primary inline-block">
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="flex flex-col md:grid md:grid-cols-[1fr_380px] items-start">
            {/* Item List */}
            <div className="space-y-3 md:pr-6 md:border-r border-b md:border-b-0 border-gray-200 py-2 pb-6 md:pb-2">
              {formattedItems.map((item: any) => (
              <CartCheckbox key={item.id}>
                <div className="card p-4 flex gap-4 items-center relative">
                  {/* Image */}
                  <div className="bg-blue-50 w-16 h-16 rounded-lg flex-shrink-0 relative overflow-hidden">
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
                    <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.seller} · {item.location}</p>
                    <p className="text-primary font-bold mt-1">
                      {formatPrice(item.price)}/{item.unit}
                    </p>
                  </div>
                  {/* Qty Control and Remove */}
                  <CartItemControl itemId={item.id} initialQty={item.qty} />
                </div>
              </CartCheckbox>
              ))}
            </div>

            {/* Summary */}
            <div className="md:pl-6 pt-6 md:pt-2 w-full">
              <div className="card p-5 space-y-3 md:sticky md:top-20">
                <h2 className="font-bold text-gray-800 text-lg">
                  Ringkasan Pesanan
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({formattedItems.length} item)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                <div className="flex justify-between text-gray-600">
                  <span>Biaya Admin</span>
                  <span>{formatPrice(biayaAdmin)}</span>
                </div>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-gray-800">
                  <div className="flex flex-col">
                    <span>Total</span>
                    <span className="text-xs font-normal text-gray-400">(Belum Termasuk Ongkir)</span>
                  </div>
                  <span className="text-primary text-base self-center">{formatPrice(total)}</span>
                </div>
                <Link href="/checkout" className="bg-primary text-white font-semibold w-full text-center block py-3 rounded-xl hover:bg-primary/90 transition">
                  Checkout
                </Link>

              </div>
            </div>
          </div>
        )}
      </Container>
      </div>
    </div>
  );
}
