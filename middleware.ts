import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

type Role = "buyer" | "seller";

const roleAccess: Record<string, Role[]> = {
  "/seller": ["seller"],
  "/products": ["seller"],
  "/orders": ["seller"],
  "/cart": ["buyer"],
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const { supabase, getResponse } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (["/login", "/signup"].includes(path)) {
      return getResponse();
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  const [{ data: buyer }, { data: seller }] = await Promise.all([
    supabase.from("buyers").select("id").eq("id", user.id).maybeSingle(),
    supabase.from("sellers").select("id").eq("id", user.id).maybeSingle(),
  ]);

  const role: Role | null = seller ? "seller" : buyer ? "buyer" : null;

  if (path === "/login") {
    return NextResponse.redirect(new URL(role ? "/" : "/signup", request.url));
  }

  if (path === "/signup") {
    return role
      ? NextResponse.redirect(new URL("/", request.url))
      : getResponse();
  }

  const allowedRoles = roleAccess[path];

  if (!allowedRoles) {
    return getResponse();
  }

  if (!role || !allowedRoles.includes(role)) {
    return NextResponse.redirect(new URL(role ? "/" : "/signup", request.url));
  }

  return getResponse();
}

export const config = {
  matcher: ["/login", "/signup", "/cart", "/seller", "/products", "/orders"],
};
