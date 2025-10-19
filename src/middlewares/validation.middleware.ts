import type { Request, Response, NextFunction } from "express";
import { ZodError, ZodType } from "zod";
import { BadRequestException } from "../utils/response/error.response";
import z from "zod";
import { Types } from "mongoose";

type ReqTypeKey = keyof Request;
type SchemaType = Partial<Record<ReqTypeKey, ZodType>>;

export const validation = (schema: SchemaType) => {
  return (req: Request, res: Response, next: NextFunction): NextFunction => {
    const validationErrors: Array<{key: ReqTypeKey; issues: Array<{ message: string; path: (string | number | symbol)[] }> }> = [];

    for (const key of Object.keys(schema) as ReqTypeKey[]) {
      if (!schema[key]) continue;

      if (req.file) {
        req.body.attachments = req.file;
      }
      if (req.files) {
        req.body.attachments = req.files;
      }

      const validationResults = schema[key].safeParse(req[key]);
      if (!validationResults.success) {
        const errors = validationResults.error as ZodError;
        validationErrors.push({
          key,
          issues: errors.issues.map((issue) => {
            return { message: issue.message, path: issue.path };
          }),
        });
      }

      if (validationErrors.length > 0) {
        throw new BadRequestException("Validation Error", {
          cause: validationErrors,
        });
      }
    }

    return next() as unknown as NextFunction;
  };
};

export const generalFields = {
  username: z
    .string({
      error: "Username must be string",
    })
    .min(3, { error: "Min length must be 3" })
    .max(25, { error: "Max length must be 25" }), // default required
  email: z.email({ error: "Invalid email" }),
  password: z.string({ error: "Password must be string" }),
  confirmPassword: z.string({ error: "Confirm Password must be string" }),
  otp: z.string().regex(/^\d{6}/),
  file: function (mimetype: string[]) {
    return z
      .strictObject({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z.string(),
        buffer: z.any().optional(),
        path: z.string().optional(),
        size: z.number(),
      })
      .refine(
        (data) => {
          return data.path || data.buffer;
        },
        { error: "Please Provide a file" }
      );
  },
  id: z.string().refine(
    (data) => {
      return Types.ObjectId.isValid(data);
    },
    { error: "Ivalid Tag id" }
  ),
};
