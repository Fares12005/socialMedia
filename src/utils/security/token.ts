import { JwtPayload, Secret, sign, SignOptions, verify } from "jsonwebtoken";
import { HUserDocumnet, RoleEnum, UserModel } from "../../DB/models/User.model";
import {BadRequestException,NotFoundException,UnauthorizedException} from "../response/error.response";
import { UserRepository } from "../../DB/reposetories/user.repository";
import { v4 as uuid } from "uuid";
import { TokenModel } from "../../DB/models/token.model";
import { TokenRepository } from "../../DB/reposetories/token.repository";


export enum SignatureLevelEnum {USER = "USER", ADMIN = "ADMIN"}

export enum TokenEnum {ACCESS = "ACCESS", REFRESH = "REFRESH"}

export enum LogoutEnum {only = "ONLY", all = "ALL"}

export const generateToken = async ({
  payload,
  secret = process.env.ACCESS_USER_SIGNATURE as string,
  options = { expiresIn: Number(process.env.ACCESS_USER_EXPIRES_IN) }}: {payload: object; secret?: Secret; options?: SignOptions}): Promise<string> => {
  return await sign(payload, secret, options);
};

export const verifyToken = async ({
  token,
  secret = process.env.ACCESS_USER_SIGNATURE as string,
}: {
  token: string;
  secret?: Secret;
}): Promise<JwtPayload> => {
  return (await verify(token, secret)) as JwtPayload;
};

export const getSignatureLevel = async (role: RoleEnum = RoleEnum.USER) => {
  let signatureLevel: SignatureLevelEnum = SignatureLevelEnum.USER;
  switch (role) {
    case RoleEnum.ADMIN:
      signatureLevel = SignatureLevelEnum.ADMIN;
      break;
    case RoleEnum.USER:
      signatureLevel = SignatureLevelEnum.USER;
    default:
      break;
  }
  return signatureLevel;
};

export const getSignatures = async (
  signatureLevel: SignatureLevelEnum = SignatureLevelEnum.USER
) => {
  let signatures: { access_signature: string; refresh_signature: string } = {
    access_signature: "",
    refresh_signature: "",
  };

  switch (signatureLevel) {
    case SignatureLevelEnum.ADMIN:
      signatures.access_signature = process.env
        .ACCESS_ADMIN_SIGNATURE as string;
      signatures.refresh_signature = process.env
        .REFRESH_ADMIN_SIGNATURE as string;
      break;
    case SignatureLevelEnum.USER:
      signatures.access_signature = process.env.ACCESS_USER_SIGNATURE as string;
      signatures.refresh_signature = process.env
        .REFRESH_USER_SIGNATURE as string;
      break;
    default:
      break;
  }

  return signatures;
};

export const createLoginCredentials = async (user: HUserDocumnet) => {
  const signatureLevel = await getSignatureLevel(user.role);
  const signatures = await getSignatures(signatureLevel);

  const jwtid = uuid();
  const accessToken = await generateToken({
    payload: { _id: user._id },
    secret: signatures.access_signature,
    options: { expiresIn: Number(process.env.ACCESS_EXPIRES_IN), jwtid },
  });

  const refreshToken = await generateToken({
    payload: { _id: user._id },
    secret: signatures.refresh_signature,
    options: { expiresIn: Number(process.env.REFRESH_EXPIRES_IN), jwtid },
  });

  return { accessToken, refreshToken };
};

export const decodeToken = async ({
  authorization,
  tokenType = TokenEnum.ACCESS,
}: {
  authorization: string;
  tokenType?: TokenEnum;
}) => {
  const userModel = new UserRepository(UserModel);
  const tokenModel = new TokenRepository(TokenModel);

  const [bearer, token] = authorization.split(" ");
  if (!bearer || !token) throw new UnauthorizedException("Missing Token Parts");

  const signatures = await getSignatures(bearer as SignatureLevelEnum);

  const decoded = await verifyToken({
    token,
    secret:
      tokenType === TokenEnum.REFRESH
        ? signatures.refresh_signature
        : signatures.access_signature,
  });

  if (!decoded?._id || !decoded?.iat)
    throw new UnauthorizedException("Invalid Token Payload");

  if (await tokenModel.findOne({ filter: { jti: decoded.jti } }))
    throw new UnauthorizedException("Invalid or old login Credentials");

  const user = await userModel.findOne({
    filter: { _id: decoded._id },
  });
  if (!user) throw new NotFoundException("Not Register Account");

  if (user.changeCredentialsTime?.getTime() || 0 > decoded.iat * 1000)
    throw new UnauthorizedException("Invalid or old login Credentials");

  return { user, decoded };
};

export const createRovkedToken = async (decoded: JwtPayload) => {
  const tokenModel = new TokenRepository(TokenModel);
  const [results] =
    (await tokenModel.create({
      data: [
        {
          jti: decoded?.jti as string,
          expiresIn:
            (decoded?.iat as number) + Number(process.env.REFRESH_EXPIRES_IN),
          userId: decoded?._id,
        },
      ],
      options: { validateBeforeSave: true },
    })) || [];

  if (!results) throw new BadRequestException("Failed to Revoke Token");

  return results;
};
