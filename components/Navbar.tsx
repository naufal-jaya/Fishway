"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Home, LogOut, LogIn, ShoppingCart, Tag, User, Search, Package, ClipboardList, Store, Menu, X } from "lucide-react";
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
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    <>
    <nav className="bg-[#407BB5] text-white shadow-md sticky top-0 z-[100]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <Image
            src="/images/logotemp.png"
            alt="logo"
            width={100}
            height={100}
            className="w-16 md:w-24"
          ></Image>
        </Link>

        {/* Search Bar — hanya tampil untuk non-Penjual */}
        {userInfo.role !== "Penjual" && (
          <form onSubmit={handleSearch} className="flex flex-1 mx-2 md:mx-4 md:max-w-md relative">
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
        )}

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {userInfo.role === "Penjual" ? (
            <>
              <Link href="/products" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${pathname === "/products" ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/90"}`}><Package size={18} /> <span className="hidden lg:inline">Produk Saya</span></Link>
              <Link href="/seller/orders" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${pathname === "/seller/orders" ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/90"}`}><ClipboardList size={18} /> <span className="hidden lg:inline">Pesanan</span></Link>
              <Link href="/seller" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${pathname === "/seller" ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/90"}`}><Store size={18} /> <span className="hidden lg:inline">Toko</span></Link>
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

        {/* Mobile: Notif + Hamburger */}
        <div className="flex md:hidden items-center gap-1">
          {userInfo.id && <NotificationDropdown userId={userInfo.id} />}
          <button
            className="items-center p-2 rounded hover:bg-white/10 transition"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
       </div>
    </nav>
    {/* Mobile Drawer */}
{drawerOpen && (
  <div className="fixed inset-0 z-[100] flex md:hidden">
    {/* Overlay */}
    <div
      className="absolute inset-0 bg-black/40"
      onClick={() => setDrawerOpen(false)}
    />
    {/* Drawer */}
    <div className="relative ml-auto w-64 h-full bg-[#407BB5] text-white flex flex-col p-6 shadow-xl justify-between">
    <div className="flex flex-col">
    {/* Close */}
      <button
        className="self-end mb-6 hover:bg-white/10 p-1 rounded"
        onClick={() => setDrawerOpen(false)}
      >
        <X size={22} />
      </button>

      {/* Label PAGES */}
      <p className="text-xs font-bold text-white/50 tracking-widest mb-3">PAGES</p>
      <div className="flex flex-col gap-1 mb-6">
        {userInfo.role === "Penjual" ? (
          <>
            <Link href="/products" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-medium"><Package size={18} />Produk Saya</Link>
            <Link href="/seller/orders" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-medium"><ClipboardList size={18} /> Pesanan</Link>
            <Link href="/seller" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-medium"><Store size={18} /> Toko</Link>
          </>
        ) : userInfo.role === "Pembeli" ? (
          <>
            <Link href="/" onClick={() => setDrawerOpen(false)} className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-medium ${pathname === "/" ? "bg-white/20" : ""}`}><Home size={18} /> Home</Link>
            <Link href="/cart" onClick={() => setDrawerOpen(false)} className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-medium ${pathname === "/cart" ? "bg-white/20" : ""}`}><ShoppingCart size={18} /> Keranjang</Link>
<Link href="/orders" onClick={() => setDrawerOpen(false)} className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-medium ${pathname === "/orders" ? "bg-white/20" : ""}`}><ClipboardList size={18} /> Orders</Link>
          </>
        ) : (
          <Link href="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-medium"><Home size={18} /> Home</Link>
        )}
      </div>
    
    </div>
    
      <div className="flex flex-col gap-1">
        {userInfo.name ? (
          <>
            <div className="border-t border-white/20 mb-2 pt-2">
              <Link href="/profile" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-medium"><User size={18} /> {userInfo.name}</Link>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-medium text-left w-full"><LogOut size={18} /> Logout</button>
          </>
        ) : (
          <Link href="/login" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-medium"><LogIn size={18} /> Masuk</Link>
        )}
      </div>
    </div>
  </div>
)}
</>
  );
}
