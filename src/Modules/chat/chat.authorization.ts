import { RoleEnum } from "../../DB/models/User.model";

export const endpoint = {
  getChat: [RoleEnum.USER, RoleEnum.ADMIN],
  chatgroup: [RoleEnum.USER, RoleEnum.ADMIN],
};
