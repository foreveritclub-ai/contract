// src/components/contract/PaymentSection.tsx
"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { FiLock, FiCreditCard, FiSmartphone, FiGlobe } from "react-icons/fi";
import { FaPaypal, FaStripe } from "react-icons/fa";

interface PaymentSectionProps {
  amount: number;
  currency?: string;
  contractRef: string;
  clientEmail: string;
  clientName: string;
  clientPhone?: string;
  onPaymentComplete: () => void;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  amount,
  currency = "USD",
  contractRef,
  clientEmail,
  clientName,
  clientPhone,
  onPaymentComplete,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods = [
    {
      id: "stripe",
      name: "Credit Card",
      icon: <FiCreditCard className="w-6 h-6" />,
      brandIcon: <FaStripe className="w-8 h-8" />,
      description: "Visa, Mastercard, Amex",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      id: "paypal",
      name: "PayPal",
      icon: <FaPaypal className="w-6 h-6" />,
      description: "International payments",
      gradient: "from-indigo-500 to-indigo-600",
    },
    {
      id: "flutterwave",
      name: "Flutterwave",
      icon: <FiGlobe className="w-6 h-6" />,
      description: "Cards, Bank Transfer",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      id: "momo",
      name: "Mobile Money",
      icon: <FiSmartphone className="w-6 h-6" />,
      description: "MTN, Airtel, M-Pesa",
      gradient: "from-green-500 to-green-600",
    },
  ];

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setIsProcessing(true);

    try {
      // Call appropriate payment API based on selected method
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: selectedMethod,
          amount,
          currency,
          contractRef,
          email: clientEmail,
          name: clientName,
          phone: clientPhone,
        }),
      });

      const data = await response.json();

      if (selectedMethod === "stripe" && data.clientSecret) {
        // Handle Stripe payment
        toast.success("Redirecting to payment page...");
        // In production, integrate Stripe Elements
      } else if (selectedMethod === "flutterwave" && data.paymentLink) {
        // Redirect to Flutterwave checkout
        window.location.href = data.paymentLink;
      } else if (selectedMethod === "momo
