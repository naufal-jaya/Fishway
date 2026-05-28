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
  const biayaAdmin = 5000;
  const total = subtotal + shipping;

  return (
    <div>
      <Navbar />
      <Container>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

        <CheckoutClient
          addresses={addresses}
          defaultName={account?.name || ""}
          defaultPhone={buyer?.phone || ""}
          formattedItems={formattedItems}
          shipping={shipping}
          biayaAdmin={biayaAdmin}
          total={total}
        />
      </Container>
    </div>
  );
}