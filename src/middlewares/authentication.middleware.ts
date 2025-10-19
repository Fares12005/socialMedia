import type { NextFunction, Request, Response } from "express";
import {BadRequestException,ForbiddenException} from "../utils/response/error.response";
import { decodeToken, TokenEnum } from "../utils/security/token";
import { RoleEnum } from "../DB/models/User.model";

export const authentication = (accessRoles: RoleEnum[] = [],tokenType: TokenEnum = TokenEnum.ACCESS) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization)
      throw new BadRequestException("Missing Authorization Header");

    const { decoded , user } = await decodeToken({authorization: req.headers.authorization , tokenType});

    if (!accessRoles.includes(user.role))
      throw new ForbiddenException(
        "You are not authorized to access thos route"
      );

    req.user = user;
    req.decoded = decoded;
    next();
  };
};
