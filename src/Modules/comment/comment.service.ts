import { PostRepository } from "../../DB/reposetories/post.repository";
import { AllowCommentsEnum, PostModel } from "../../DB/models/post.model";
import { UserModel } from "../../DB/models/User.model";
import { UserRepository } from "../../DB/reposetories/user.repository";
import { Request, Response } from "express";
import { CommentRepository } from "../../DB/reposetories/comment.repository";
import { CommentModel } from "../../DB/models/comment.model";
import { postAvailability } from "../post/post.service";
import {
  BadRequestException,
  NotFoundException,
} from "../../utils/response/error.response";
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config";

class CommetService {
  private _userModel = new UserRepository(UserModel);
  private _postModel = new PostRepository(PostModel);
  private _commentModel = new CommentRepository(CommentModel);

  constructor() {}

  createComment = async (req: Request, res: Response) => {
    const { postId } = req.params as unknown as { postId: string };
    const post = await this._postModel.findOne({
      filter: {
        _id: postId,
        allowComments: AllowCommentsEnum.ALLOW,
        $or: postAvailability(req),
      },
    });
    if (!post) throw new NotFoundException("Fail To Match Results");

    if (
      req.body.tags?.length &&
      (await this._userModel.find({ filter: { _id: { $in: req.body.tags } } }))
        .length !== req.body.tags.length
    ) {
      throw new NotFoundException("Some Mentioned User does not exists");
    }

    let attachments: string[] = [];
    if (req.files?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${post.createdBy}/post/${post.assetPostFolderId}`,
      });
    }

    const comment =
      (await this._commentModel.create({
        data: [
          {
            ...req.body,
            attachments,
            postId,
            createdBy: req.user?._id,
          },
        ],
      })) || [];

    if (!comment) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments });
      }
      throw new BadRequestException("Fail to create Comment");
    }

    return res.status(201).json({ message: "Comment Created Successfully" });
  };


  
  createCommentReply = async (req: Request, res: Response) => {
    const { postId, commentId } = req.params as unknown as {postId: string; commentId: string;}


    const post = await this._postModel.findOne({filter: {postId: postId , allowComments: AllowCommentsEnum.ALLOW, $or: postAvailability(req)}})
    if(!post) throw new NotFoundException("Comment Not Found")




      if (
      req.body.tags?.length &&
      (await this._userModel.find({ filter: { _id: { $in: req.body.tags } } }))
        .length !== req.body.tags.length
    ) {
      throw new NotFoundException("Some Mentioned User does not exists");
    }

    let attachments: string[] = [];
    if (req.files?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${post.createdBy}/post/${post.assetPostFolderId}`,
      });
    }

    const comment =
      (await this._commentModel.create({
        data: [
          {
            ...req.body,
            attachments,
            commentId,
            postId,
            createdBy: req.user?._id,
          },
        ],
      })) || [];

    if (!comment) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments });
      }
      throw new BadRequestException("Fail to create Comment");
    }

    return res.status(201).json({ message: "Comment Created Successfully" });






  }

  
}

export default new CommetService();
