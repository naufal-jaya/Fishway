import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const midtransClient = require("midtrans-client");

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);



export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, buyer_id, status, created_at")
    .eq("id", params.id)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Jika status masih Menunggu Pembayaran, cek ke Midtrans
  const { searchParams } = new URL(req.url);
  const midtransId = searchParams.get("midtrans_id");

  if (order.status === "Menunggu Pembayaran") {
    // 1. Kumpulkan daftar ID yang mungkin digunakan di Midtrans
    const checkIds = [params.id];
    for (let i = 1; i <= 5; i++) {
      checkIds.push(`${params.id}-${i}`);
    }

    if (midtransId && !checkIds.includes(midtransId)) {
      checkIds.push(midtransId);
    }

    // 2. Cari order yang dibuat bersamaan (dalam range 10 detik) untuk menangani checkout multi-store
    try {
      const createdAtTime = new Date(order.created_at).getTime();
      const { data: siblingOrders } = await supabase
        .from("orders")
        .select("id, created_at")
        .eq("buyer_id", order.buyer_id);

      if (siblingOrders) {
        siblingOrders.forEach((sibling: any) => {
          const diff = Math.abs(new Date(sibling.created_at).getTime() - createdAtTime);
          if (diff < 10000 && sibling.id !== params.id) {
            checkIds.push(sibling.id);
            for (let i = 1; i <= 5; i++) {
              checkIds.push(`${sibling.id}-${i}`);
            }
          }
        });
      }
    } catch (e) {
      console.error("Error fetching sibling orders for status check:", e);
    }

    // 3. Query status secara paralel ke Midtrans
    try {
      const apiClient = new midtransClient.CoreApi({
        isProduction: false,
        serverKey: process.env.MIDTRANS_SERVER_KEY,
        clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
      });

      const statusPromises = checkIds.map(async (checkId) => {
        try {
          const res = await apiClient.transaction.status(checkId);
          return res;
        } catch {
          return null; // Abaikan jika tidak ditemukan
        }
      });

      const results = await Promise.all(statusPromises);
      const validResults = results.filter((r) => r !== null);

      if (validResults.length > 0) {
        // Cari yang berstatus sukses / settlement / capture
        const successTx = validResults.find(
          (r) => r.transaction_status === "settlement" || r.transaction_status === "capture"
        );
        const latestTx = successTx || validResults[0];

        const transactionStatus = latestTx.transaction_status;
        const fraudStatus = latestTx.fraud_status;

        let updateStatus = "";

        if (transactionStatus === "capture") {
          if (fraudStatus === "accept") {
            updateStatus = "Menunggu Konfirmasi";
          }
        } else if (transactionStatus === "settlement") {
          updateStatus = "Menunggu Konfirmasi";
        } else if (
          transactionStatus === "cancel" ||
          transactionStatus === "deny" ||
          transactionStatus === "expire"
        ) {
          updateStatus = "Dibatalkan";
        } else if (transactionStatus === "pending") {
          updateStatus = "Menunggu Pembayaran";
        }

        if (updateStatus && updateStatus !== order.status) {
          const orderIdsString = latestTx.custom_field1;
          const orderIds = orderIdsString ? orderIdsString.split(",") : [params.id];

          // Update status di Supabase untuk semua order terkait (menggunakan admin client untuk bypass RLS)
          await supabaseAdmin
            .from("orders")
            .update({ status: updateStatus })
            .in("id", orderIds);

          // Revalidate cache agar perubahan langsung tercermin di halaman
          orderIds.forEach((id: string) => {
            revalidatePath(`/orders/${id}`);
            revalidatePath(`/dashboard/orders/${id}`);
          });
          revalidatePath("/orders");
          revalidatePath("/dashboard/orders");
          revalidatePath("/dashboard");

          return NextResponse.json({ status: updateStatus }, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
          });
        }
      }
    } catch (err: any) {
      console.error("Error checking Midtrans status in API:", err.message);
    }
  }

  return NextResponse.json({ status: order.status }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}

