import express from "express";
import path from "node:path";
import type { Express, Request, Response } from "express";
import { config } from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
config({ path: path.resolve("./config/.env.dev") });
import authRouter from "./Modules/Auth/auth.controller";
import userRouter from "./Modules/User/user.controller";
import postRouter from "./Modules/post/post.controller";
import chatRouter from "./Modules/chat/chat.controller";
import {globalErrorHandler} from "./utils/response/error.response";
import connectDB from "./DB/connection";



const limitter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15min
  limit: 100,
  message: {
    status: 429,
    message: "Too many requests from this IP, please try later",
  },
});

export const bootstrap = async (): Promise<void> => {
  const app: Express = express();
  const port: number = Number(process.env.PORT) || 5000;

  app.use(cors(), express.json(), helmet()); // global middlewares
  app.use(limitter);
  await connectDB();

  app.get("/users", (req: Request, res: Response) => {
    return res.status(200).json({ message: "Hello From Express With TS" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/user", userRouter);
  app.use("/api/post", postRouter);
  app.use("/api/chat", chatRouter);

 

  app.use(globalErrorHandler);




      app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });



  
};

// v4 vs v5
//
