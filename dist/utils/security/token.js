"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRovkedToken = exports.decodeToken = exports.createLoginCredentials = exports.getSignatures = exports.getSignatureLevel = exports.verifyToken = exports.generateToken = exports.LogoutEnum = exports.TokenEnum = exports.SignatureLevelEnum = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const User_model_1 = require("../../DB/models/User.model");
const error_response_1 = require("../response/error.response");
const user_repository_1 = require("../../DB/reposetories/user.repository");
const uuid_1 = require("uuid");
const token_model_1 = require("../../DB/models/token.model");
const token_repository_1 = require("../../DB/reposetories/token.repository");
var SignatureLevelEnum;
(function (SignatureLevelEnum) {
    SignatureLevelEnum["USER"] = "USER";
    SignatureLevelEnum["ADMIN"] = "ADMIN";
})(SignatureLevelEnum || (exports.SignatureLevelEnum = SignatureLevelEnum = {}));
var TokenEnum;
(function (TokenEnum) {
    TokenEnum["ACCESS"] = "ACCESS";
    TokenEnum["REFRESH"] = "REFRESH";
})(TokenEnum || (exports.TokenEnum = TokenEnum = {}));
var LogoutEnum;
(function (LogoutEnum) {
    LogoutEnum["only"] = "ONLY";
    LogoutEnum["all"] = "ALL";
})(LogoutEnum || (exports.LogoutEnum = LogoutEnum = {}));
const generateToken = async ({ payload, secret = process.env.ACCESS_USER_SIGNATURE, options = { expiresIn: Number(process.env.ACCESS_USER_EXPIRES_IN) }, }) => {
    return await (0, jsonwebtoken_1.sign)(payload, secret, options);
};
exports.generateToken = generateToken;
const verifyToken = async ({ token, secret = process.env.ACCESS_USER_SIGNATURE, }) => {
    return (await (0, jsonwebtoken_1.verify)(token, secret));
};
exports.verifyToken = verifyToken;
const getSignatureLevel = async (role = User_model_1.RoleEnum.USER) => {
    let signatureLevel = SignatureLevelEnum.USER;
    switch (role) {
        case User_model_1.RoleEnum.ADMIN:
            signatureLevel = SignatureLevelEnum.ADMIN;
            break;
        case User_model_1.RoleEnum.USER:
            signatureLevel = SignatureLevelEnum.USER;
        default:
            break;
    }
    return signatureLevel;
};
exports.getSignatureLevel = getSignatureLevel;
const getSignatures = async (signatureLevel = SignatureLevelEnum.USER) => {
    let signatures = {
        access_signature: "",
        refresh_signature: "",
    };
    switch (signatureLevel) {
        case SignatureLevelEnum.ADMIN:
            signatures.access_signature = process.env
                .ACCESS_ADMIN_SIGNATURE;
            signatures.refresh_signature = process.env
                .REFRESH_ADMIN_SIGNATURE;
            break;
        case SignatureLevelEnum.USER:
            signatures.access_signature = process.env.ACCESS_USER_SIGNATURE;
            signatures.refresh_signature = process.env
                .REFRESH_USER_SIGNATURE;
            break;
        default:
            break;
    }
    return signatures;
};
exports.getSignatures = getSignatures;
const createLoginCredentials = async (user) => {
    const signatureLevel = await (0, exports.getSignatureLevel)(user.role);
    const signatures = await (0, exports.getSignatures)(signatureLevel);
    const jwtid = (0, uuid_1.v4)();
    const accessToken = await (0, exports.generateToken)({
        payload: { _id: user._id },
        secret: signatures.access_signature,
        options: { expiresIn: Number(process.env.ACCESS_EXPIRES_IN), jwtid },
    });
    const refreshToken = await (0, exports.generateToken)({
        payload: { _id: user._id },
        secret: signatures.refresh_signature,
        options: { expiresIn: Number(process.env.REFRESH_EXPIRES_IN), jwtid },
    });
    return { accessToken, refreshToken };
};
exports.createLoginCredentials = createLoginCredentials;
const decodeToken = async ({ authorization, tokenType = TokenEnum.ACCESS, }) => {
    const userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    const tokenModel = new token_repository_1.TokenRepository(token_model_1.TokenModel);
    const [bearer, token] = authorization.split(" ");
    if (!bearer || !token)
        throw new error_response_1.UnauthorizedException("Missing Token Parts");
    const signatures = await (0, exports.getSignatures)(bearer);
    const decoded = await (0, exports.verifyToken)({
        token,
        secret: tokenType === TokenEnum.REFRESH
            ? signatures.refresh_signature
            : signatures.access_signature,
    });
    if (!decoded?._id || !decoded?.iat)
        throw new error_response_1.UnauthorizedException("Invalid Token Payload");
    if (await tokenModel.findOne({ filter: { jti: decoded.jti } }))
        throw new error_response_1.UnauthorizedException("Invalid or old login Credentials");
    const user = await userModel.findOne({
        filter: { _id: decoded._id },
    });
    if (!user)
        throw new error_response_1.NotFoundException("Not Register Account");
    if (user.changeCredentialsTime?.getTime() || 0 > decoded.iat * 1000)
        throw new error_response_1.UnauthorizedException("Invalid or old login Credentials");
    return { user, decoded };
};
exports.decodeToken = decodeToken;
const createRovkedToken = async (decoded) => {
    const tokenModel = new token_repository_1.TokenRepository(token_model_1.TokenModel);
    const [results] = (await tokenModel.create({
        data: [
            {
                jti: decoded?.jti,
                expiresIn: decoded?.iat + Number(process.env.REFRESH_EXPIRES_IN),
                userId: decoded?._id,
            },
        ],
        options: { validateBeforeSave: true },
    })) || [];
    if (!results)
        throw new error_response_1.BadRequestException("Failed to Revoke Token");
    return results;
};
exports.createRovkedToken = createRovkedToken;
