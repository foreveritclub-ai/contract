// src/server/routers/contract.ts
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { prisma } from "@/lib/db/prisma";
import { TRPCError } from "@trpc/server";
import { ContractStatus, PaymentStatus } from "@prisma/client";
import { generateAccessCode } from "@/lib/utils/access-code";
import { sendContractEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

export const contractRouter = router({
  // Get all contracts (admin)
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const contracts = await prisma.contract.findMany({
      include: {
        client: true,
        developer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return contracts;
  }),

  // Get contract by reference
  getByRef: publicProcedure
    .input(z.object({ ref: z.string() }))
    .query(async ({ input }) => {
      const contract = await prisma.contract.findUnique({
        where: { contractRef: input.ref },
        include: {
          client: true,
          developer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          payments: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      if (!contract) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contract not found",
        });
      }

      return contract;
    }),

  // Create new contract
  create: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        amount: z.number().positive(),
        currency: z.string().default("USD"),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const contractRef = `EG-IoT-${new Date().getFullYear()}-${Math.floor(
        Math.random() * 1000
      )
        .toString()
        .padStart(3, "0")}`;

      const accessCode = generateAccessCode();

      const contract = await prisma.contract.create({
        data: {
          contractRef,
          clientId: input.clientId,
          title: input.title,
          description: input.description,
          amount: input.amount,
          currency: input.currency,
          startDate: input.startDate,
          endDate: input.endDate,
          developerId: ctx.session.user.id,
          status: ContractStatus.DRAFT,
          paymentStatus: PaymentStatus.PENDING,
          accessCodes: {
            create: {
              accessCode,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
          },
        },
        include: {
          client: true,
          accessCodes: true,
        },
      });

      // Send access code to client email
      await sendContractEmail({
        to: contract.client.email,
        contractRef,
        accessCode,
        amount: contract.amount,
      });

      return contract;
    }),

  // Submit client signature
  signAsClient: publicProcedure
    .input(
      z.object({
        contractRef: z.string(),
        signature: z.string(),
        accessCode: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Verify access code
      const access = await prisma.contractAccess.findFirst({
        where: {
          contract: {
            contractRef: input.contractRef,
          },
          accessCode: input.accessCode,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!access) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired access code",
        });
      }

      const contract = await prisma.contract.update({
        where: { contractRef: input.contractRef },
        data: {
          clientSignature: input.signature,
          clientSignedAt: new Date(),
          status: ContractStatus.PENDING_DEVELOPER,
        },
        include: {
          client: true,
        },
      });

      // Log audit
      await prisma.signatureAudit.create({
        data: {
          contractId: contract.id,
          clientId: contract.clientId,
          action: "signed_client",
          ipAddress: "::1", // In production, get from request
        },
      });

      return { success: true, message: "Contract signed successfully" };
    }),

  // Submit developer signature
  signAsDeveloper: protectedProcedure
    .input(
      z.object({
        contractRef: z.string(),
        signature: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const contract = await prisma.contract.update({
        where: { contractRef: input.contractRef },
        data: {
          developerSignature: input.signature,
          developerSignedAt: new Date(),
          developerId: ctx.session.user.id,
          status: ContractStatus.FULLY_SIGNED,
          signedAt: new Date(),
        },
      });

      // Log audit
      await prisma.signatureAudit.create({
        data: {
          contractId: contract.id,
          userId: ctx.session.user.id,
          action: "signed_developer",
        },
      });

      return { success: true, message: "Contract finalized successfully" };
    }),

  // Update payment status
  updatePaymentStatus: protectedProcedure
    .input(
      z.object({
        contractRef: z.string(),
        paymentStatus: z.enum(["PAID", "PARTIAL", "PENDING"]),
        transactionId: z.string().optional(),
        paymentMethod: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const contract = await prisma.contract.update({
        where: { contractRef: input.contractRef },
        data: {
          paymentStatus: input.paymentStatus as PaymentStatus,
          transactionId: input.transactionId,
          paymentMethod: input.paymentMethod as any,
          paymentDate: input.paymentStatus === "PAID" ? new Date() : undefined,
        },
      });

      return contract;
    }),

  // Get signature status
  getSignatureStatus: publicProcedure
    .input(z.object({ contractRef: z.string() }))
    .query(async ({ input }) => {
      const contract = await prisma.contract.findUnique({
        where: { contractRef: input.contractRef },
        select: {
          clientSignedAt: true,
          developerSignedAt: true,
          status: true,
          paymentStatus: true,
        },
      });

      return {
        clientSigned: !!contract?.clientSignedAt,
        developerSigned: !!contract?.developerSignedAt,
        fullySigned: contract?.status === ContractStatus.FULLY_SIGNED,
        paymentComplete: contract?.paymentStatus === PaymentStatus.PAID,
        status: contract?.status,
      };
    }),

  // Send reminder
  sendReminder: protectedProcedure
    .input(z.object({ contractRef: z.string() }))
    .mutation(async ({ input }) => {
      const contract = await prisma.contract.findUnique({
        where: { contractRef: input.contractRef },
        include: { client: true },
      });

      if (!contract) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await sendContractEmail({
        to: contract.client.email,
        contractRef: contract.contractRef,
        accessCode: "REMINDER", // In production, get actual access code
        amount: contract.amount,
        isReminder: true,
      });

      return { success: true, message: "Reminder sent successfully" };
    }),
});
