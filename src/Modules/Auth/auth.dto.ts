import z from "zod";
import { signUpSchema } from "./auth.validation";

export type ISignUpDTO = z.infer<typeof signUpSchema.body>;
