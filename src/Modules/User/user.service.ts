import { Request, Response } from "express";
import { ILogoutDTO } from "./user.dto";
import {
  createLoginCredentials,
  createRovkedToken,
  LogoutEnum,
} from "../../utils/security/token";
import { Types, UpdateQuery } from "mongoose";
import { HUserDocumnet, IUser, UserModel } from "../../DB/models/User.model";
import { UserRepository } from "../../DB/reposetories/user.repository";
import { JwtPayload } from "jsonwebtoken";
import { FriendRequestRepository } from "../../DB/reposetories/friendRequest.repository";
import { Friendmodel } from "../../DB/models/freindRequest.model";
import { ConfilectException } from "../../utils/response/error.response";


class UserService {
  private _userModel = new UserRepository(UserModel);
  private _friendModel = new FriendRequestRepository(Friendmodel);
  constructor() {}

  getProfile = async (req: Request, res: Response): Promise<Response> => {
    return res
      .status(200)
      .json({ message: "Done", user: req.user, decoded: req.decoded });
  };

  logout = async (req: Request, res: Response): Promise<Response> => {
    const { flag }: ILogoutDTO = req.body;

    let statusCode = 200;
    const update: UpdateQuery<IUser> = {};
    switch (flag) {
      case LogoutEnum.all:
        update.changeCredentialsTime = new Date();
        break;
      case LogoutEnum.only:
        await createRovkedToken(req.decoded as JwtPayload);
        statusCode = 201;
        break;
      default:
        break;
    }
    await this._userModel.updateOne({
      filter: { _id: req.decoded?._id },
      update,
    });

    return res.status(statusCode).json({ message: "Done" });
  };

  refreshToken = async (req: Request, res: Response): Promise<Response> => {
    const credentials = await createLoginCredentials(req.user as HUserDocumnet);
    await createRovkedToken(req.decoded as JwtPayload);
    return res.status(201).json({ message: "Done", data: credentials });
  };


  requestAddFriend = async (req: Request, res: Response): Promise<Response> => {

    const { userId} = req.params as unknown as { userId: Types.ObjectId };

    const chekfriend = await this._friendModel.findOne({
      filter: { sendTo: {$in: [req.user?._id , userId]} ,   createdBy: {$in: [req.user?._id , userId]}},
    })

    if(chekfriend) throw new ConfilectException("You have already sent a friend request to this user");


    const user = await this._userModel.findOne({filter: { _id: userId }});


    if(!user) throw new ConfilectException("User not found");


    await this._friendModel.create({
      data: [
        {
          createdBy: req.user?._id as Types.ObjectId,
          sendTo: userId ,
        },
      ],
    });


    return res.status(201).json({ message: "Done" });


  };




  acceptRequest = async (req: Request, res: Response): Promise<Response> => {

    const {requestId} = req.params as unknown as { requestId: Types.ObjectId };


    const checkRequest = await this._friendModel.findOneAndUpdate({
      filter: { _id: requestId  , sendTo: req.user?._id  , acceptedAt: { $exists: false} },
      update: { acceptedAt: new Date() },
    });

    if(!checkRequest) throw new ConfilectException("Request not found");

    await Promise.all([
      this._userModel.updateOne({filter: {_id: checkRequest.createdBy} , update: { $addToSet: { friends: checkRequest.sendTo } } }),
      this._userModel.updateOne({filter: {_id: checkRequest.sendTo} , update: { $addToSet: { friends: checkRequest.createdBy } } }),
    ]);






    return res.status(201).json({ message: "Done" });
  }
}

export default new UserService();
