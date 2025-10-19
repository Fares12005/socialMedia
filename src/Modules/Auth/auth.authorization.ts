import { RoleEnum } from "../../DB/models/User.model";

export const endpoint = {
  image: [RoleEnum.USER, RoleEnum.ADMIN],
};
