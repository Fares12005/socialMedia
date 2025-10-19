"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const post_repository_1 = require("../../DB/reposetories/post.repository");
const post_model_1 = require("../../DB/models/post.model");
const User_model_1 = require("../../DB/models/User.model");
const user_repository_1 = require("../../DB/reposetories/user.repository");
const comment_repository_1 = require("../../DB/reposetories/comment.repository");
const comment_model_1 = require("../../DB/models/comment.model");
const post_service_1 = require("../post/post.service");
const error_response_1 = require("../../utils/response/error.response");
const s3_config_1 = require("../../utils/multer/s3.config");
class CommetService {
    _userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    _postModel = new post_repository_1.PostRepository(post_model_1.PostModel);
    _commentModel = new comment_repository_1.CommentRepository(comment_model_1.CommentModel);
    constructor() { }
    createComment = async (req, res) => {
        const { postId } = req.params;
        const post = await this._postModel.findOne({
            filter: {
                _id: postId,
                allowComments: post_model_1.AllowCommentsEnum.ALLOW,
                $or: (0, post_service_1.postAvailability)(req),
            },
        });
        if (!post)
            throw new error_response_1.NotFoundException("Fail To Match Results");
        if (req.body.tags?.length &&
            (await this._userModel.find({ filter: { _id: { $in: req.body.tags } } }))
                .length !== req.body.tags.length) {
            throw new error_response_1.NotFoundException("Some Mentioned User does not exists");
        }
        let attachments = [];
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${post.createdBy}/post/${post.assetPostFolderId}`,
            });
        }
        const [comment] = (await this._commentModel.create({
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
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException("Fail to create Comment");
        }
        return res.status(201).json({ message: "Comment Created Successfully" });
    };
}
exports.default = new CommetService();
