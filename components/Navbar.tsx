import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const supabase = createClient(cookies());
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let userInfo: { id?: string; name: string; role: "Pembeli" | "Penjual" | null } = { name: "", role: null };

  if (session?.user) {
    const [{ data: account }, { data: buyer }, { data: seller }] = await Promise.all([
      supabase.from("accounts").select("name").eq("id", session.user.id).maybeSingle(),
      supabase.from("buyers").select("id").eq("id", session.user.id).maybeSingle(),
      supabase.from("sellers").select("id").eq("id", session.user.id).maybeSingle(),
    ]);

    userInfo = {
      id: session.user.id,
      name:
        account?.name ||
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        session.user.email ||
        "User",
      role: seller ? "Penjual" : buyer ? "Pembeli" : null,
    };
  }

  return <NavbarClient initialUserInfo={userInfo} />;
}
