import mongoose from "mongoose";
import Razorpay from "razorpay";

export async function GET() {
  try {
    const { MONGODB_URI, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

    // ✅ 1. Check MongoDB
    if (!MONGODB_URI) throw new Error("MongoDB URI missing in env file");
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    // ✅ 2. Check Razorpay Credentials
    let razorpayStatus = "Not connected";
    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      try {
        const razorpay = new Razorpay({
          key_id: RAZORPAY_KEY_ID,
          key_secret: RAZORPAY_KEY_SECRET,
        });

        // Safe lightweight API call: get order list (won’t create anything)
        const orders = await razorpay.orders.all({ count: 1 });
        razorpayStatus = "Connected ✅ (keys valid)";
      } catch (err) {
        razorpayStatus = `❌ Razorpay connection failed: ${err.message}`;
      }
    }

    // ✅ 3. Check Google OAuth Client
    const googleStatus =
      GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
        ? "✅ Google client credentials loaded"
        : "❌ Missing Google OAuth credentials";

    // ✅ Response
    return Response.json({
      success: true,
      message: "✅ Full environment test successful!",
      results: {
        mongo: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        razorpay: razorpayStatus,
        google: googleStatus,
      },
    });
  } catch (err) {
    console.error("❌ Error:", err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
