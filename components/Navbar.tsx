"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Home, LogOut, LogIn, ShoppingCart, Tag, User, Search, Package, ClipboardList, Store } from "lucide-react";
import { createClient } from "@/utils/supabase/supabaseClient";
import NotificationDropdown from "./NotificationDropdown";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [userInfo, setUserInfo] = useState<{
    id?: string;
    name: string;
    role: "Pembeli" | "Penjual" | null;
  }>({ name: "", role: null });
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  useEffect(() => {
    const loadUserInfo = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const [{ data: account }, { data: buyer }, { data: seller }] =
        await Promise.all([
          supabase
            .from("accounts")
            .select("name")
            .eq("id", session.user.id)
            .maybeSingle(),
          supabase
            .from("buyers")
            .select("id")
            .eq("id", session.user.id)
            .maybeSingle(),
          supabase
            .from("sellers")
            .select("id")
            .eq("id", session.user.id)
            .maybeSingle(),
        ]);

      setUserInfo({
        id: session.user.id,
        name:
          account?.name ||
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email ||
          "User",
        role: seller ? "Penjual" : buyer ? "Pembeli" : null,
      });
    };

    loadUserInfo();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <nav className=" bg-[#407BB5] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <Image
            src="/images/logotemp.png"
            alt="logo"
            width={100}
            height={100}
          ></Image>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4 relative">
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-full text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#407BB5]">
            <Search size={18} />
          </button>
        </form>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {userInfo.role === "Penjual" ? (
            <>
              <Link href="/products" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${pathname === "/products" ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/90"}`}><Package size={18} /> <span className="hidden lg:inline">My Produk</span></Link>
              <Link href="/seller/orders" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${pathname === "/seller/orders" ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/90"}`}><ClipboardList size={18} /> <span className="hidden lg:inline">Pesanan</span></Link>
              <Link href="/seller" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${pathname === "/seller" ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/90"}`}><Store size={18} /> <span className="hidden lg:inline">Store</span></Link>
            </>
          ) : userInfo.role === "Pembeli" ? (
            <>
              <Link href="/" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${pathname === "/" ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/90"}`}><Home size={18} /> <span className="hidden lg:inline">Home</span></Link>
              <Link href="/cart" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${pathname === "/cart" ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/90"}`}><ShoppingCart size={18} /> <span className="hidden lg:inline">Keranjang</span></Link>
              <Link href="/orders" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${pathname === "/orders" ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/90"}`}><ClipboardList size={18} /> <span className="hidden lg:inline">Orders</span></Link>
            </>
          ) : (
            <>
              <Link href="/" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${pathname === "/" ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/90"}`}><Home size={18} /> <span className="hidden lg:inline">Home</span></Link>
            </>
          )}

          {userInfo.name ? (
            <>
              {userInfo.id && <NotificationDropdown userId={userInfo.id} />}
              <Link href="/profile" className="mx-2 text-right leading-tight hover:bg-white/10 p-2 rounded-lg transition-colors flex flex-col justify-center">
                <p className="max-w-[160px] truncate text-sm font-semibold">
                  {userInfo.name}
                </p>
                <p className="text-[10px] text-white/75">
                  {userInfo.role || "Profil"}
                </p>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white/90 transition-colors hover:bg-white/10 flex items-center gap-2"
              aria-label="Login"
            >
              <LogIn size={18} />
              <span className="hidden lg:inline">Masuk</span>
            </Link>
          )}
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden items-center gap-1">
          {userInfo.role === "Penjual" ? (
            <>
              <Link href="/products" className={`px-2 py-1 rounded text-xs font-medium transition-colors ${pathname === "/products" ? "bg-white/20" : "hover:bg-white/10"}`}><Package size={22} /></Link>
              <Link href="/seller/orders" className={`px-2 py-1 rounded text-xs font-medium transition-colors ${pathname === "/seller/orders" ? "bg-white/20" : "hover:bg-white/10"}`}><ClipboardList size={22} /></Link>
              <Link href="/seller" className={`px-2 py-1 rounded text-xs font-medium transition-colors ${pathname === "/seller" ? "bg-white/20" : "hover:bg-white/10"}`}><Store size={22} /></Link>
            </>
          ) : userInfo.role === "Pembeli" ? (
            <>
              <Link href="/" className={`px-2 py-1 rounded text-xs font-medium transition-colors ${pathname === "/" ? "bg-white/20" : "hover:bg-white/10"}`}><Home size={22} /></Link>
              <Link href="/cart" className={`px-2 py-1 rounded text-xs font-medium transition-colors ${pathname === "/cart" ? "bg-white/20" : "hover:bg-white/10"}`}><ShoppingCart size={22} /></Link>
              <Link href="/orders" className={`px-2 py-1 rounded text-xs font-medium transition-colors ${pathname === "/orders" ? "bg-white/20" : "hover:bg-white/10"}`}><ClipboardList size={22} /></Link>
            </>
          ) : (
            <>
              <Link href="/" className={`px-2 py-1 rounded text-xs font-medium transition-colors ${pathname === "/" ? "bg-white/20" : "hover:bg-white/10"}`}><Home size={22} /></Link>
            </>
          )}
          
          {userInfo.name ? (
            <>
              {userInfo.id && <NotificationDropdown userId={userInfo.id} />}
              <Link href="/profile" className={`px-2 py-1 rounded text-xs font-medium transition-colors ${pathname === "/profile" ? "bg-white/20" : "hover:bg-white/10"}`}><User size={22} /></Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-white/10"
                aria-label="Logout"
              >
                <LogOut size={22} />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-white/10"
              aria-label="Login"
            >
              <LogIn size={22} />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
