import type { Request, Response } from "express";
import { ISignUpDTO } from "./auth.dto";
import { UserModel } from "../../DB/models/User.model";
import {
  BadRequestException,
  ConfilectException,
  NotFoundException,
} from "../../utils/response/error.response";
import { UserRepository } from "../../DB/reposetories/user.repository";
import { compareHash, generateHash } from "../../utils/security/hash";
import { emailEvent } from "../../utils/events/email.event";
import { generateOTP } from "../../utils/generateOTP ";
import { createLoginCredentials } from "../../utils/security/token";
import {
  createPreSignedURL,
  uploadFile,
  uploadFiles,
  uploadLargeFile,
} from "../../utils/multer/s3.config";
import { StorageEnum } from "../../utils/multer/cloud.multer";

class AuthenricationService {
  private _userModel = new UserRepository(UserModel);

  constructor() {}

  signUp = async (req: Request, res: Response): Promise<Response> => {
    const { username, email, password }: ISignUpDTO = req.body;

    const checkUser = await this._userModel.findOne({
      filter: { email },
      options: {
        lean: true,
      },
    });

    if (checkUser) throw new ConfilectException("User Already Exists");

    const otp = generateOTP();
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

  login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password } = req.body;

    const user = await this._userModel.findOne({
      filter: { email },
    });

    if (!user) throw new NotFoundException("Invalid Account");

    if (!compareHash(password, user.password))
      throw new BadRequestException("Invalid Password");

    const credentials = await createLoginCredentials(user);

    return res
      .status(200)
      .json({ message: "User Logged In Successfully", credentials });
  };

  confirmEmail = async (req: Request, res: Response): Promise<Response> => {
    const { email, otp } = req.body;

    const user = await this._userModel.findOne({
      filter: {
        email,
        confirmEmailOTP: { $exists: true },
        confirmedAt: { $exists: false },
      },
    });
    if (!user) throw new NotFoundException("Invalid Account");

    if (!compareHash(otp, user?.confirmEmailOTP))
      throw new BadRequestException("Invalid OTP");

    // update user updateOne
    await this._userModel.updateOne({
      filter: { email },
      update: {
        confirmedAt: Date.now(),
        $unset: { confirmEmailOTP: true },
      },
    });

    return res.status(200).json({ message: "User confirmed Successfully" });
  };

  profileImage = async (req: Request, res: Response): Promise<Response> => {
    // const key = await uploadFile({
    //   file: req.file as Express.Multer.File,
    //   path: `users/${req.decoded?._id}`,
    // });

    // const key = await uploadLargeFile({
    //   file: req.file as Express.Multer.File,
    //   path: `users/${req.decoded?._id}`,
    // });

    const {
      ContentType,
      Originalname,
    }: { ContentType: string; Originalname: string } = req.body;

    const { url, Key } = await createPreSignedURL({
      ContentType,
      Originalname,
      path: `users/${req.decoded?._id}`,
    });

    return res
      .status(200)
      .json({ message: "Profile Image Uploaded Successfully", url, Key });
  };

  covetImages = async (req: Request, res: Response): Promise<Response> => {
    const urls = await uploadFiles({
      storageApproch: StorageEnum.DISK,
      files: req.files as Express.Multer.File[],
      path: `user/${req.decoded?._id}/cover`,
    });

    return res
      .status(200)
      .json({ message: "Profile Image Uploaded Successfully", urls });
  };
}

export default new AuthenricationService();
