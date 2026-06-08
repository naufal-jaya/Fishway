import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const midtransClient = require("midtrans-client");


// Initialize Supabase Client with service role to bypass RLS for webhook
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! // Note: Ideally use SERVICE_ROLE_KEY here
);

let apiClient = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Verify signature/notification via Midtrans Client
    const statusResponse = await apiClient.transaction.notification(body);

    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;
    
    // The orderIds were stored in custom_field1
    const orderIdsString = statusResponse.custom_field1;
    if (!orderIdsString) {
      return NextResponse.json({ message: "No custom_field1 found" }, { status: 200 });
    }

    const orderIds = orderIdsString.split(",");
    
    let updateStatus = "";

    if (transactionStatus === "capture") {
      if (fraudStatus === "accept") {
        updateStatus = "Menunggu Konfirmasi"; // Paid and accepted
      }
    } else if (transactionStatus === "settlement") {
      updateStatus = "Menunggu Konfirmasi"; // Paid
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      updateStatus = "Dibatalkan"; // Failed/Expired
    } else if (transactionStatus === "pending") {
      updateStatus = "Menunggu Pembayaran";
    }

    if (updateStatus) {
      // Update all associated orders in Supabase
      const { error } = await supabaseAdmin
        .from("orders")
        .update({ status: updateStatus })
        .in("id", orderIds);

      if (error) {
        console.error("Supabase update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Revalidate cached pages so status change is reflected immediately
      orderIds.forEach((id: string) => {
        revalidatePath(`/orders/${id}`);
        revalidatePath(`/dashboard/orders/${id}`);
      });
      revalidatePath("/orders");
      revalidatePath("/dashboard/orders");
      revalidatePath("/dashboard");
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
