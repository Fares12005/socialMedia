"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("../../utils/security/token");
const User_model_1 = require("../../DB/models/User.model");
const user_repository_1 = require("../../DB/reposetories/user.repository");
class UserService {
    _userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
    getProfile = async (req, res) => {
        return res
            .status(200)
            .json({ message: "Done", user: req.user, decoded: req.decoded });
    };
    logout = async (req, res) => {
        const { flag } = req.body;
        let statusCode = 200;
        const update = {};
        switch (flag) {
            case token_1.LogoutEnum.all:
                update.changeCredentialsTime = new Date();
                break;
            case token_1.LogoutEnum.only:
                await (0, token_1.createRovkedToken)(req.decoded);
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
    refreshToken = async (req, res) => {
        const credentials = await (0, token_1.createLoginCredentials)(req.user);
        await (0, token_1.createRovkedToken)(req.decoded);
        return res.status(201).json({ message: "Done", data: credentials });
    };
}
exports.default = new UserService();
