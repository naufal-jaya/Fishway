import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";
  const action = requestUrl.searchParams.get("action");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = createClient(cookies());
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const [{ data: buyer }, { data: seller }] = await Promise.all([
      supabase.from("buyers").select("id").eq("id", user.id).maybeSingle(),
      supabase.from("sellers").select("id").eq("id", user.id).maybeSingle(),
    ]);

    const isRegistered = buyer || seller;

    if (action === "login") {
      if (!isRegistered) {
        // Sign out from the session
        await supabase.auth.signOut();
        
        // Delete the user from auth.users using the service role key
        const { createClient: createAdminClient } = await import("@supabase/supabase-js");
        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        await supabaseAdmin.auth.admin.deleteUser(user.id);

        return NextResponse.redirect(`${origin}/login?error=not_registered`);
      }
    } else if (action === "signup") {
      if (isRegistered) {
        return NextResponse.redirect(`${origin}/`);
      }
      return NextResponse.redirect(`${origin}/signup`);
    } else {
      if (!isRegistered && next !== "/signup") {
        return NextResponse.redirect(`${origin}/signup`);
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
