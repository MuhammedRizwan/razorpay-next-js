"use client";
import axios from "axios";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useState } from "react";

interface RazorpayOptions {
  key: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// Declare the Razorpay constructor globally
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

export default function Home() {
  const [amount, setAmount] = useState<number>(0);
  const Router=useRouter()

  const createOrder = async () => {
    try {
      const res = await axios.post("/api/createOrder", {
        amount: amount * 100,
      });

      if (!res.data) throw new Error("Failed to create order");

      const data = await res.data;
      const paymentData: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID as string,
        order_id: data.id,
        handler: async (response: RazorpayResponse) => {
          const res = await axios.post("/api/verifyOrder", {
            orderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          const data = await res.data;
          if (data.isOk) {
            Router.push("/success");
          } else {
            Router.push("/cancel");
          }
        },
        theme: {
          color: "#3399cc",
        },
      };
      const paymentObject = new window.Razorpay(paymentData);
      paymentObject.open();
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Order creation failed. Please try again.");
    }
  };

  return (
    <div className="flex w-screen h-screen items-center justify-center flex-col gap-4">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <input
        type="number"
        placeholder="Enter Amount"
        className="px-4 py-2 rounded-md text-black"
        required
        min={1}
        onChange={(e) => setAmount(Number(e.target.value))}
      />

      <button
        className="px-4 py-2 rounded-md text-white bg-black"
        onClick={createOrder}
      >
        Create Order
      </button>
    </div>
  );
}
