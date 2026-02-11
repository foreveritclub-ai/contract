// src/components/contract/SignaturePad.tsx
"use client";

import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";
import { FiPenTool, FiRefreshCw, FiCheck } from "react-icons/fi";

interface SignaturePadProps {
  onSave: (signature: string) => void;
  title?: string;
  subtitle?: string;
  disabled?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  title = "Digital Signature",
  subtitle = "Sign using your mouse or touch screen",
  disabled = false,
}) => {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);

  const clearSignature = () => {
    signatureRef.current?.clear();
    setSavedSignature(null);
  };

  const saveSignature = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const signatureData = signatureRef.current
        .getTrimmedCanvas()
        .toDataURL("image/png");
      setSavedSignature(signatureData);
      onSave(signatureData);
    }
  };

  return (
    <Card className="w-full p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FiPenTool className="w-5 h-5 text-blue-500" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white">
          <SignatureCanvas
            ref={signatureRef}
            canvasProps={{
              className: "w-full h-48 cursor-crosshair",
              width: 600,
              height: 200,
            }}
            onBegin={() => setIsDrawing(true)}
            onEnd={() => setIsDrawing(false)}
            disabled={disabled || !!savedSignature}
          />
        </div>

        {savedSignature && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <FiCheck className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900">
                Signature Saved
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            onClick={clearSignature}
            disabled={disabled || !signatureRef.current || savedSignature}
            className="flex items-center gap-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            Clear
          </Button>
          <Button
            onClick={saveSignature}
            disabled={disabled || savedSignature}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            <FiCheck className="w-4 h-4" />
            Save Signature
          </Button>
        </div>
      </motion.div>

      {disabled && (
        <p className="text-sm text-amber-600 dark:text-amber-400 mt-4 text-center">
          ⚠️ Payment required to enable signature
        </p>
      )}
    </Card>
  );
};
