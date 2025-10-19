"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_model_1 = require("../../DB/models/User.model");
const error_response_1 = require("../../utils/response/error.response");
const user_repository_1 = require("../../DB/reposetories/user.repository");
const hash_1 = require("../../utils/security/hash");
const generateOTP_1 = require("../../utils/generateOTP ");
const token_1 = require("../../utils/security/token");
const s3_config_1 = require("../../utils/multer/s3.config");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
class AuthenricationService {
    _userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
    signUp = async (req, res) => {
        const { username, email, password } = req.body;
        const checkUser = await this._userModel.findOne({
            filter: { email },
            options: {
                lean: true,
            },
        });
        if (checkUser)
            throw new error_response_1.ConfilectException("User Already Exists");
        const otp = (0, generateOTP_1.generateOTP)();
        const user = await this._userModel.createUser({
            data: [
                {
                    username,
                    email,
                    password,
                    confirmEmailOTP: `${otp}`,
                },
            ],
            options: { validateBeforeSave: true },
        });
        return res.status(201).json({ message: "User Created Successfully", user });
    };
    login = async (req, res) => {
        const { email, password } = req.body;
        const user = await this._userModel.findOne({
            filter: { email },
        });
        if (!user)
            throw new error_response_1.NotFoundException("Invalid Account");
        if (!(0, hash_1.compareHash)(password, user.password))
            throw new error_response_1.BadRequestException("Invalid Password");
        const credentials = await (0, token_1.createLoginCredentials)(user);
        return res
            .status(200)
            .json({ message: "User Logged In Successfully", credentials });
    };
    confirmEmail = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this._userModel.findOne({
            filter: {
                email,
                confirmEmailOTP: { $exists: true },
                confirmedAt: { $exists: false },
            },
        });
        if (!user)
            throw new error_response_1.NotFoundException("Invalid Account");
        if (!(0, hash_1.compareHash)(otp, user?.confirmEmailOTP))
            throw new error_response_1.BadRequestException("Invalid OTP");
        await this._userModel.updateOne({
            filter: { email },
            update: {
                confirmedAt: Date.now(),
                $unset: { confirmEmailOTP: true },
            },
        });
        return res.status(200).json({ message: "User confirmed Successfully" });
    };
    profileImage = async (req, res) => {
        const { ContentType, Originalname, } = req.body;
        const { url, Key } = await (0, s3_config_1.createPreSignedURL)({
            ContentType,
            Originalname,
            path: `users/${req.decoded?._id}`,
        });
        return res
            .status(200)
            .json({ message: "Profile Image Uploaded Successfully", url, Key });
    };
    covetImages = async (req, res) => {
        const urls = await (0, s3_config_1.uploadFiles)({
            storageApproch: cloud_multer_1.StorageEnum.DISK,
            files: req.files,
            path: `user/${req.decoded?._id}/cover`,
        });
        return res
            .status(200)
            .json({ message: "Profile Image Uploaded Successfully", urls });
    };
}
exports.default = new AuthenricationService();
