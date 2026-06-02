import { NextResponse } from "next/server";
// @ts-ignore
import midtransClient from "midtrans-client";

// Create Snap API instance
let snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderIds, totalAmount, customerDetails, itemDetails } = body;

    if (!orderIds || !totalAmount) {
      return NextResponse.json(
        { error: "orderIds and totalAmount are required" },
        { status: 400 }
      );
    }

    // Midtrans only accepts 1 string for order_id per transaction.
    // We generate a unique transaction ID.
    // And pass the array of Supabase order IDs as custom_field1 so we can retrieve them in the webhook.
    const transactionId = `PAY-${Date.now()}`;
    const orderIdsString = Array.isArray(orderIds) ? orderIds.join(",") : orderIds;

    let parameter = {
      transaction_details: {
        order_id: transactionId,
        gross_amount: totalAmount,
      },
      customer_details: customerDetails,
      item_details: itemDetails,
      custom_field1: orderIdsString, // max 255 chars
    };

    const transaction = await snap.createTransaction(parameter);

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      transaction_id: transactionId,
    });
  } catch (error: any) {
    console.error("Midtrans createTransaction error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
