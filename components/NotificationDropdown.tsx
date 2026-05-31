"use client";

import { useEffect, useState, useRef } from "react";
import {
  Bell,
  ClipboardList,
  Package,
  Truck,
  Check,
  X,
  Clock,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/utils/supabase/supabaseClient";
import { useRouter } from "next/navigation";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/notifications";

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

// Hanya tampilkan notif yang berkaitan dengan status pesanan
function isOrderNotif(notif: Notification): boolean {
  const t = notif.title.toLowerCase();
  const m = notif.message.toLowerCase();
  return (
    t.includes("pesanan") ||
    t.includes("dikirim") ||
    t.includes("dibatalkan") ||
    t.includes("dikonfirmasi") ||
    t.includes("diproses") ||
    t.includes("selesai") ||
    t.includes("status") ||
    m.includes("pesanan") ||
    (notif.link?.startsWith("/orders") ?? false)
  );
}

// Icon & warna ngikutin status di halaman profile
// data dari DB: "Pesanan Anda sekarang berstatus: Dikirim/Diproses/Selesai/Menunggu Konfirmasi"
function getStatusInfo(title: string, message: string): {
  icon: React.ReactNode;
  bg: string;
  color: string;
} {
  // ekstrak status dari format "berstatus: XXX"
  const statusMatch = message.toLowerCase().match(/berstatus[:\s]+(.+)/);
  const status = statusMatch ? statusMatch[1].trim().toLowerCase() : "";
  const combined = (title + " " + message).toLowerCase();

 if (status === "dikirim" || combined.includes("dikirim") || combined.includes("pengiriman"))
  return { icon: <Truck size={14} />, bg: "bg-purple-50", color: "text-purple-500" };
 
  if (status === "diproses" || status === "dikonfirmasi" || combined.includes("diproses") || combined.includes("dikonfirmasi"))
    return { icon: <Package size={14} />, bg: "bg-blue-50", color: "text-blue-500" };

  if (status === "selesai" || status === "diterima" || combined.includes("selesai") || combined.includes("diterima") || combined.includes("berhasil"))
    return { icon: <Check size={14} />, bg: "bg-green-50", color: "text-green-500" };

  if (status === "dibatalkan" || status === "ditolak" || combined.includes("dibatalkan") || combined.includes("ditolak") || combined.includes("gagal"))
    return { icon: <X size={14} />, bg: "bg-red-50", color: "text-red-500" };

  // menunggu konfirmasi / default
  return { icon: <Clock size={14} />, bg: "bg-orange-50", color: "text-orange-400" };
}

function stripEmoji(text: string): string {
  return text
    .split("")
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code < 0x2600 || (code > 0x27BF && code < 0xFE00) || code > 0xFE0F;
    })
    .join("")
    .trim();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationDropdown({
  userId,
  label,
}: {
  userId: string;
  label?: string;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) setNotifications(data.filter(isOrderNotif));
    };

    fetchNotifications();

    const channel = supabase
      .channel(`notifications_${userId}_${Math.random()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          if (!isOrderNotif(newNotif)) return;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = async (notif: Notification) => {
    setIsOpen(false);
    if (!notif.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      await markNotificationAsRead(notif.id);
    }
    if (notif.link) router.push(notif.link);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await markAllNotificationsAsRead();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/10 flex items-center gap-3 relative w-full"
        aria-label="Notifikasi"
      >
        <Bell size={20} className="text-white/90" />
        {label && <span className="text-sm font-medium">{label}</span>}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-1 md:right-3 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800 text-sm">Notifikasi</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary font-medium hover:underline"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="p-10 text-center">
                <ClipboardList size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Belum ada notifikasi pesanan</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const { icon, bg, color } = getStatusInfo(notif.title, notif.message);

                return (
                  <div
                    key={notif.id}
                    className={`px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notif.is_read ? "bg-blue-50/30" : ""
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div
                        className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${bg} ${color}`}
                      >
                        {icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-0.5">
                          <p
                            className={`text-sm leading-snug ${
                              !notif.is_read
                                ? "font-semibold text-gray-900"
                                : "font-medium text-gray-600"
                            }`}
                          >
                            {stripEmoji(notif.title)}
                          </p>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>

                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {stripEmoji(notif.message)}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[10px] text-gray-400">
                            {formatDate(notif.created_at)}
                          </p>
                          {notif.link && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notif);
                              }}
                              className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 bg-primary/8 hover:bg-primary/15 px-2 py-1 rounded-full transition-colors"
                            >
                              <ArrowRight size={10} />
                              Lihat Pesanan
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t text-center">
              <p className="text-[11px] text-gray-400">
                {notifications.length} notifikasi terakhir
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 