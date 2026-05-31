"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, ShoppingCart, ClipboardList, ArrowRight, Package, Truck, Check, Clock, X } from "lucide-react";
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

// Tentukan label & icon tombol CTA berdasarkan link notifikasi
function getCtaInfo(link: string | null): { label: string; icon: React.ReactNode } | null {
  if (!link) return null;
  if (link === "/cart")
    return { label: "Lihat Keranjang", icon: <ShoppingCart size={11} /> };
  if (link === "/orders")
    return { label: "Lihat Pesanan", icon: <ClipboardList size={11} /> };
  if (link.startsWith("/orders/"))
    return { label: "Detail Pesanan", icon: <ClipboardList size={11} /> };
  if (link.startsWith("/dashboard/orders/"))
    return { label: "Kelola Pesanan", icon: <Package size={11} /> };
  if (link.startsWith("/dashboard"))
    return { label: "Buka Dashboard", icon: <ArrowRight size={11} /> };
  return { label: "Lihat", icon: <ArrowRight size={11} /> };
}

// Icon per judul notif
function getNotifIcon(title: string): React.ReactNode {
  const t = title.toLowerCase();
  if (t.includes("keranjang")) return <ShoppingCart size={15} className="text-blue-500" />;
  if (t.includes("pesanan baru")) return <Package size={15} className="text-green-500" />;
  if (t.includes("berhasil")) return <Check size={15} className="text-green-500" />;
  if (t.includes("dikirim")) return <Truck size={15} className="text-purple-500" />;
  if (t.includes("dibatalkan")) return <X size={15} className="text-red-500" />;
  if (t.includes("diperbarui") || t.includes("status")) return <Clock size={15} className="text-orange-400" />;
  return <Bell size={15} className="text-gray-400" />;
}

export default function NotificationDropdown({ userId, label }: { userId: string; label?: string }) {
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
      
      if (data) setNotifications(data);
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
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev].slice(0, 20));
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
    if (notif.link) {
      router.push(notif.link);
    }
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
        aria-label="Notifications"
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
          <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-gray-500" />
              <h3 className="font-bold text-gray-800 text-sm">Notifikasi</h3>
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
                <Bell size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Belum ada notifikasi</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const cta = getCtaInfo(notif.link);
                const icon = getNotifIcon(notif.title);

                return (
                  <div
                    key={notif.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notif.is_read ? "bg-blue-50/40" : ""
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${!notif.is_read ? "bg-white shadow-sm border border-gray-100" : "bg-gray-100"}`}>
                        {icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-0.5">
                          <p className={`text-sm leading-snug ${!notif.is_read ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>

                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[10px] text-gray-400">
                            {new Date(notif.created_at).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>

                          {/* Tombol CTA eksplisit */}
                          {cta && notif.link && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notif);
                              }}
                              className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 bg-primary/8 hover:bg-primary/15 px-2 py-1 rounded-full transition-colors"
                            >
                              {cta.icon}
                              {cta.label}
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
            <div className="px-4 py-2.5 border-t bg-gray-50 text-center">
              <p className="text-[11px] text-gray-400">{notifications.length} notifikasi terakhir</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}