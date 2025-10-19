import { RoleEnum } from "../../DB/models/User.model";

export const endpoint = {
  profile: [RoleEnum.USER, RoleEnum.ADMIN],
  logout: [RoleEnum.USER, RoleEnum.ADMIN],
  refreshToken: [RoleEnum.USER, RoleEnum.ADMIN],
  requestAddFriend: [RoleEnum.USER],
  accept: [RoleEnum.USER],
};
