// src/lib/payments/flutterwave.ts
import axios from "axios";

const FLW_BASE_URL = "https://api.flutterwave.com/v3";
const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY!;

export interface FlutterwavePaymentParams {
  amount: number;
  email: string;
  phone?: string;
  name: string;
  contractRef: string;
  redirectUrl: string;
}

export async function createFlutterwavePayment({
  amount,
  email,
  phone,
  name,
  contractRef,
  redirectUrl,
}: FlutterwavePaymentParams) {
  try {
    const payload = {
      tx_ref: `EGREED-${contractRef}-${Date.now()}`,
      amount,
      currency: "USD",
      redirect_url: redirectUrl,
      meta: {
        contract_ref: contractRef,
        platform: "Egreed Technology",
      },
      customer: {
        email,
        name,
        phonenumber: phone,
      },
      customizations: {
        title: "Egreed Technology",
        description: `Contract Payment - ${contractRef}`,
        logo: "https://egreedtech.org/logo.png",
      },
    };

    const response = await axios.post(`${FLW_BASE_URL}/payments`, payload, {
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    return {
      paymentLink: response.data.data.link,
      transactionRef: payload.tx_ref,
    };
  } catch (error) {
    console.error("Flutterwave payment creation failed:", error);
    throw new Error("Failed to create payment link");
  }
}

export async function verifyFlutterwaveTransaction(transactionId: string) {
  try {
    const response = await axios.get(
      `${FLW_BASE_URL}/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
        },
      }
    );

    return {
      status: response.data.data.status,
      amount: response.data.data.amount,
      currency: response.data.data.currency,
    };
  } catch (error) {
    console.error("Flutterwave verification failed:", error);
    throw new Error("Transaction verification failed");
  }
}
