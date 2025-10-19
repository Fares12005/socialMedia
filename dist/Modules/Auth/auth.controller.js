"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = __importDefault(require("./auth.service"));
const validation_middleware_1 = require("../../middlewares/validation.middleware");
const auth_validation_1 = require("./auth.validation");
const authentication_middleware_1 = require("../../middlewares/authentication.middleware");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
const auth_authorization_1 = require("./auth.authorization");
const token_1 = require("../../utils/security/token");
const router = (0, express_1.Router)();
router.post("/signup", (0, validation_middleware_1.validation)(auth_validation_1.signUpSchema), auth_service_1.default.signUp);
router.post("/login", (0, validation_middleware_1.validation)(auth_validation_1.loginSchema), auth_service_1.default.login);
router.patch("/profile-image", (0, authentication_middleware_1.authentication)(auth_authorization_1.endpoint.image, token_1.TokenEnum.ACCESS), (0, cloud_multer_1.cloudFileUplaod)({
    storageApproch: cloud_multer_1.StorageEnum.MEMORY,
    validation: cloud_multer_1.fileValidation.images,
    maxsize: 2,
}).single("attachment"), auth_service_1.default.profileImage);
router.patch("/profile-cover-image", (0, authentication_middleware_1.authentication)(auth_authorization_1.endpoint.image, token_1.TokenEnum.ACCESS), (0, cloud_multer_1.cloudFileUplaod)({
    storageApproch: cloud_multer_1.StorageEnum.DISK,
    validation: cloud_multer_1.fileValidation.images,
    maxsize: 2,
}).array("attachments", 5), auth_service_1.default.covetImages);
router.patch("/confirm-email", (0, validation_middleware_1.validation)(auth_validation_1.confirmEmailSchema), auth_service_1.default.confirmEmail);
exports.default = router;
