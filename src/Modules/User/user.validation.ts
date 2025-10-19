import z from "zod";
import { LogoutEnum } from "../../utils/security/token";

export const logoutSchema = {
  body: z.strictObject({
    flag: z.enum(LogoutEnum).default(LogoutEnum.only),
  }),
};
export const requestAddFriendSchema = {
  body: z.strictObject({
    flag: z.enum(LogoutEnum).default(LogoutEnum.only),
  }),
};
