// src/lib/payments/stripe.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
  typescript: true,
});

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  contractRef: string;
  clientEmail: string;
}

export async function createPaymentIntent({
  amount,
  currency = "usd",
  contractRef,
  clientEmail,
}: CreatePaymentIntentParams) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: {
        contract_ref: contractRef,
        client_email: clientEmail,
        platform: "Egreed Technology",
      },
      receipt_email: clientEmail,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error("Stripe payment intent creation failed:", error);
    throw new Error("Payment processing failed");
  }
}

export async function confirmPayment(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    };
  } catch (error) {
    console.error("Payment confirmation failed:", error);
    throw new Error("Payment confirmation failed");
  }
}
