import { RoleEnum } from "../../DB/models/User.model";

export const endpoint = {
  createComment: [RoleEnum.USER, RoleEnum.ADMIN],
};
