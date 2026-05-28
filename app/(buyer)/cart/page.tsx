import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Container from "@/components/Container";
import { createClient } from "@/utils/supabase/server";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import CartClient from "@/components/CartClient";

export default async function CartPage() {
  const supabase = createClient(cookies());

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: cart } = await supabase
    .from("carts")
    .select(`
      id,
      cart_items (
        id,
        quantity,
        products (
          id, name, type, price, unit, stock, gambar, location,
          stores (name)
        ),
        price_options (
          id, label, price, stock
        )
      )
    `)
    .eq("buyer_id", user.id)
    .maybeSingle();

  const cartItems = cart?.cart_items || [];

  const formattedItems = cartItems.map((item: any) => {
    const product = Array.isArray(item.products) ? item.products[0] : item.products;
    const variant = Array.isArray(item.price_options) ? item.price_options[0] : item.price_options;

    const itemPrice = product?.type === 0 ? product.price : variant?.price || 0;
    const itemUnit = product?.type === 0 ? product.unit : variant?.label || "unit";
    const itemStock = product?.type === 0 ? (product?.stock ?? 99) : (variant?.stock ?? 99);

    return {
      id: item.id,
      productId: product?.id,
      name: product?.name || "Produk Tidak Ditemukan",
      seller:
        (Array.isArray(product?.stores)
          ? product?.stores[0]?.name
          : product?.stores?.name) || "Penjual",
      location: product?.location || "-",
      gambar: product?.gambar || "/images/default.png",
      qty: item.quantity,
      price: itemPrice,
      unit: itemUnit,
      stock: itemStock,
    };
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Container>
          <div className="flex items-center gap-3 mb-6">
            <BackButton />
            <h1 className="text-2xl font-bold text-gray-800">Keranjang</h1>
          </div>
          <CartClient items={formattedItems} />
        </Container>
      </div>
    </div>
  );
}

