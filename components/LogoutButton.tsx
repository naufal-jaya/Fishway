"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/supabaseClient";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="card px-5 py-4 flex items-center gap-3 text-left hover:border-red-200 transition-colors"
    >
      <LogOut size={22} className="text-red-500" />
      <div>
        <p className="font-semibold text-red-500 text-sm">Keluar</p>
        <p className="text-xs text-gray-400">Logout akun</p>
      </div>
    </button>
  );
}