import { RoleEnum } from "../../DB/models/User.model";

export const endpoint = {
  createPost: [RoleEnum.USER, RoleEnum.ADMIN],
};
