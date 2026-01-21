import { z } from "zod";

export const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]$/, {
    message: "Slug may include letters, numbers, dots, and dashes.",
  });

export const demoFieldSchema = z.object({
  key: z.string().trim().min(1).max(50),
  label: z.string().trim().min(1).max(80),
  type: z.enum(["text", "select", "number", "email", "tel", "textarea"]),
  placeholder: z.string().trim().max(120).optional().or(z.literal("")),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1).max(60)).optional(),
});

export const createTokenSchema = z.object({
  name: z.string().trim().min(2).max(60),
  value: z.string().trim().min(6).max(500),
});

export const createAssistantSchema = z.object({
  name: z.string().trim().min(2).max(60),
  assistantId: z.string().trim().min(2).max(120),
});

export const createPhoneNumberSchema = z.object({
  name: z.string().trim().min(2).max(60),
  phoneNumberId: z.string().trim().min(2).max(120),
  phoneNumber: z.string().trim().max(30).optional().or(z.literal("")),
});

export const createDemoPageSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().max(80).optional().or(z.literal("")),
  bolchoTokenId: z.string().trim().min(1),
  assistantId: z.string().trim().min(1),
  phoneNumberId: z.string().trim().min(1),
  fields: z.array(demoFieldSchema).min(1),
  callToFieldKey: z.string().trim().min(1),
  passwordRequired: z.boolean().default(false),
  password: z.string().trim().min(4).max(100).optional().or(z.literal("")),
  maxCalls: z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 1 && v <= 100000), {
      message: "maxCalls must be empty (unlimited) or a number >= 1",
    }),
});


