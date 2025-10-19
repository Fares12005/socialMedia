"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = void 0;
const express_1 = __importDefault(require("express"));
const node_path_1 = __importDefault(require("node:path"));
const dotenv_1 = require("dotenv");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
(0, dotenv_1.config)({ path: node_path_1.default.resolve("./config/.env.dev") });
const auth_controller_1 = __importDefault(require("./Modules/Auth/auth.controller"));
const user_controller_1 = __importDefault(require("./Modules/User/user.controller"));
const post_controller_1 = __importDefault(require("./Modules/post/post.controller"));
const error_response_1 = require("./utils/response/error.response");
const connection_1 = __importDefault(require("./DB/connection"));
const s3_config_1 = require("./utils/multer/s3.config");
const node_stream_1 = require("node:stream");
const node_util_1 = require("node:util");
const createS3WriteStreamPipe = (0, node_util_1.promisify)(node_stream_1.pipeline);
const limitter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: {
        status: 429,
        message: "Too many requests from this IP, please try later",
    },
});
const bootstrap = async () => {
    const app = (0, express_1.default)();
    const port = Number(process.env.PORT) || 5000;
    app.use((0, cors_1.default)(), express_1.default.json(), (0, helmet_1.default)());
    app.use(limitter);
    await (0, connection_1.default)();
    app.get("/users", (req, res) => {
        return res.status(200).json({ message: "Hello From Express With TS" });
    });
    app.use("/api/auth", auth_controller_1.default);
    app.use("/api/user", user_controller_1.default);
    app.use("/api/post", post_controller_1.default);
    app.get("/test", async (req, res) => {
        const results = await (0, s3_config_1.deleteFiles)({
            urls: [
                "SCOIAL_APP/users/68cef38470857f02e707e878/0001c216-6334-4cf6-943f-b3e991c7eb63-presigned-file1.jpg",
                "SCOIAL_APP/users/68cef38470857f02e707e878/da7bffbc-5ae4-42e8-8c06-306a80a3fcdf-presigned-file2.jpg",
            ],
        });
        return res.status(200).json({ message: "Done", results });
    });
    app.get("/test-s3", async (req, res) => {
        const { Key } = req.query;
        const results = await (0, s3_config_1.deleteFile)({ Key: Key });
        return res.status(200).json({ message: "Done", results });
    });
    app.get("/upload/pre-signed/*path", async (req, res) => {
        const { downloadName, download } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const url = await (0, s3_config_1.createGetPreSignedURL)({
            Key,
            downloadName: downloadName,
            download: download,
        });
        return res.status(200).json({ message: "Done", url });
    });
    app.get("/upload/*path", async (req, res) => {
        const { downloadName } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const s3Response = await (0, s3_config_1.getFile)({ Key });
        if (!s3Response?.Body) {
            throw new error_response_1.BadRequestException("Fail t ofetch asset");
        }
        res.setHeader("Content-Type", `${s3Response.ContentType}` || "application/octet-stream");
        if (downloadName) {
            res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
        }
        return await createS3WriteStreamPipe(s3Response.Body, res);
    });
    app.use(error_response_1.globalErrorHandler);
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
};
exports.bootstrap = bootstrap;
