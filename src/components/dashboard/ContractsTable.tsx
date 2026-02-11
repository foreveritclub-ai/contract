// src/components/dashboard/ContractsTable.tsx
"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc/client";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { 
  FiFileText, 
  FiCheckCircle, 
  FiClock, 
  FiXCircle,
  FiSend,
  FiEye,
  FiMoreVertical 
} from "react-icons/fi";

interface ContractsTableProps {
  filter?: "all" | "pending" | "signed" | "paid";
}

export const ContractsTable: React.FC<ContractsTableProps> = ({ filter = "all" }) => {
  const { data: contracts, isLoading } = trpc.contract.getAll.useQuery();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: "bg-gray-100 text-gray-800", icon: FiFileText, label: "Draft" },
      PENDING_CLIENT: { color: "bg-yellow-100 text-yellow-800", icon: FiClock, label: "Awaiting Client" },
      PENDING_DEVELOPER: { color: "bg-blue-100 text-blue-800", icon: FiClock, label: "Awaiting Developer" },
      PENDING_PAYMENT: { color: "bg-orange-100 text-orange-800", icon: FiClock, label: "Payment Required" },
      PARTIALLY_SIGNED: { color: "bg-purple-100 text-purple-800", icon: FiCheckCircle, label: "Partially Signed" },
      FULLY_SIGNED: { color: "bg-green-100 text-green-800", icon: FiCheckCircle, label: "Fully Signed" },
      COMPLETED: { color: "bg-green-100 text-green-800", icon: FiCheckCircle, label: "Completed" },
      EXPIRED: { color: "bg-red-100 text-red-800", icon: FiXCircle, label: "Expired" },
    };

    return statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Contract
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Signatures
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {contracts?.map((contract, index) => {
              const StatusBadge = getStatusBadge(contract.status);
              const Icon = StatusBadge.icon;

              return (
                <motion.tr
                  key={contract.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {contract.contractRef}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {contract.title}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {contract.client.companyName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {contract.client.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      ${contract.amount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {contract.paymentStatus}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${StatusBadge.color}`}>
                      <Icon className="w-3.5 h-3.5 mr-1" />
                      {StatusBadge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {contract.clientSignedAt ? (
                          <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center">
                            <FiCheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                            <FiClock className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        {contract.developerSignedAt ? (
                          <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center">
                            <FiCheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                            <FiClock className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {contract.clientSignedAt && contract.developerSignedAt
                          ? "Complete"
                          : `${contract.clientSignedAt ? "1/2" : "0/2"}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(contract.updatedAt), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => window.location.href = `/contract/${contract.contractRef}`}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {/* Send reminder */}}
                        className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <FiSend className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <FiMoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {contracts?.length === 0 && (
        <div className="text-center py-12">
          <FiFileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No contracts yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Create your first contract to get started
          </p>
        </div>
      )}
    </div>
  );
};
