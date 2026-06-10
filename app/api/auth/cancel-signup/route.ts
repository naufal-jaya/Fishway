import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Check if they are registered in buyers or sellers
    const [{ data: buyer }, { data: seller }] = await Promise.all([
      supabase.from("buyers").select("id").eq("id", user.id).maybeSingle(),
      supabase.from("sellers").select("id").eq("id", user.id).maybeSingle(),
    ]);

    // Only allow deletion if they are NOT fully registered
    if (!buyer && !seller) {
      const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      await supabase.auth.signOut();
      return NextResponse.json({ success: true });
    }
  }

  return NextResponse.json({ success: false });
}
