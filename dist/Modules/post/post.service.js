"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postAvailability = void 0;
const post_repository_1 = require("../../DB/reposetories/post.repository");
const post_model_1 = require("../../DB/models/post.model");
const User_model_1 = require("../../DB/models/User.model");
const user_repository_1 = require("../../DB/reposetories/user.repository");
const error_response_1 = require("../../utils/response/error.response");
const s3_config_1 = require("../../utils/multer/s3.config");
const uuid_1 = require("uuid");
const mongoose_1 = require("mongoose");
const postAvailability = (req) => {
    return [
        { availability: post_model_1.AvailabilityEnum.PUBLIC },
        { availability: post_model_1.AvailabilityEnum.ONLYME, createdBy: req.user?._id },
        {
            availability: post_model_1.AvailabilityEnum.FRIENDS,
            createdBy: {
                $in: [...(req.user?.friends || []), req.user?._id],
            },
        },
        { availability: post_model_1.AvailabilityEnum.ONLYME, tags: { $in: req.user?._id } },
    ];
};
exports.postAvailability = postAvailability;
class PostService {
    _userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    _postModel = new post_repository_1.PostRepository(post_model_1.PostModel);
    constructor() { }
    createPost = async (req, res) => {
        if (req.body.tags?.length &&
            (await this._userModel.find({ filter: { _id: { $in: req.body.tags } } }))
                .length !== req.body.tags.length) {
            throw new error_response_1.NotFoundException("Some Mentioned User does not exists");
        }
        let attachments = [];
        let assetPostFolderId = (0, uuid_1.v4)();
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${req.user?._id}/post/${assetPostFolderId}`,
            });
        }
        const [post] = (await this._postModel.create({
            data: [
                {
                    ...req.body,
                    attachments,
                    assetPostFolderId,
                    createdBy: req.user?._id,
                },
            ],
        })) || [];
        if (!post) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException("Fail to create Post");
        }
        return res.status(201).json({ message: "Post Created Successfully", post });
    };
    likeUnlikePost = async (req, res) => {
        const { postId } = req.params;
        const { action } = req.query;
        let update = {
            $addToSet: { likes: req.user?._id },
        };
        if (action === post_model_1.ActionEnum.UNLIKE) {
            update = { $pull: { likes: req.user?._id } };
        }
        const post = await this._postModel.findOneAndUpdate({
            filter: {
                _id: postId,
                $or: (0, exports.postAvailability)(req),
            },
            update,
        });
        if (!post) {
            throw new error_response_1.NotFoundException("Post Does Not Exists");
        }
        return res.status(200).json({ message: "Done", post });
    };
    updatePost = async (req, res) => {
        const { postId } = req.params;
        const post = await this._postModel.findOne({
            filter: { _id: postId, createdBy: req.user?._id },
        });
        if (!post)
            throw new error_response_1.NotFoundException("Post Does Not Exists");
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
        const updatePost = await this._postModel.updateOne({
            filter: { _id: postId },
            update: [
                {
                    $set: {
                        content: req.body.content,
                        allowComments: req.body.allowComments || post.allowComments,
                        availability: req.body.availability || post.availability,
                        attachments: {
                            $setUnion: [
                                {
                                    $setDifference: [
                                        "$attachments",
                                        req.body.removedAttachments || [],
                                    ],
                                },
                                attachments,
                            ],
                        },
                        tags: {
                            $setUnion: [
                                {
                                    $setDifference: [
                                        "$tags",
                                        (req.body.removedTags || []).map((tag) => {
                                            return mongoose_1.Types.ObjectId.createFromHexString(tag);
                                        }),
                                    ],
                                },
                                (req.body.tags || []).map((tag) => {
                                    return mongoose_1.Types.ObjectId.createFromHexString(tag);
                                }),
                            ],
                        },
                    },
                },
            ],
        });
        if (!updatePost.modifiedCount) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException("Fail To update Post");
        }
        else {
            if (req.body.removedAttachments?.length) {
                await (0, s3_config_1.deleteFiles)({ urls: req.body.removedAttachments });
            }
        }
        return res.status(200).json({ message: "Done" });
    };
    getPosts = async (req, res) => {
        let { page, size } = req.query;
        const posts = await this._postModel.paginate({
            filter: { $or: (0, exports.postAvailability)(req) },
            page,
            size,
        });
        return res.status(200).json({ message: "Done", posts });
    };
}
exports.default = new PostService();
