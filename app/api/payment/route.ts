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

    const baseId = Array.isArray(orderIds) ? orderIds[0] : orderIds;
    const orderIdsString = Array.isArray(orderIds) ? orderIds.join(",") : orderIds;

    let transaction = null;
    let transactionId = baseId;
    let attempts = 0;

    while (attempts < 5) {
      try {
        const id = attempts === 0 ? baseId : `${baseId}-${attempts}`;
        let parameter = {
          transaction_details: {
            order_id: id,
            gross_amount: totalAmount,
          },
          customer_details: customerDetails,
          item_details: itemDetails,
          custom_field1: orderIdsString, // max 255 chars
        };
        transaction = await snap.createTransaction(parameter);
        transactionId = id;
        break; // Success!
      } catch (error: any) {
        const errMsg = error.message || "";
        if (
          errMsg.includes("already been used") || 
          errMsg.includes("sudah pernah digunakan") || 
          errMsg.includes("400") || 
          errMsg.includes("406")
        ) {
          attempts++;
        } else {
          throw error;
        }
      }
    }

    if (!transaction) {
      throw new Error("Gagal membuat transaksi di Midtrans setelah beberapa percobaan.");
    }

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
