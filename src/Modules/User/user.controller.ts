import { Router } from "express";
import userService from "./user.service";
import { endpoint } from "./user.authorization";
import { authentication } from "../../middlewares/authentication.middleware";
import { TokenEnum } from "../../utils/security/token";
import * as validators from "./user.validation";
import { validation } from "../../middlewares/validation.middleware";
import chatRouter from "../chat/chat.controller";
const router = Router();

router.use(`/:userId/chat` , chatRouter)

router.get("/profile",authentication(endpoint.profile),userService.getProfile);
router.post("/logout", authentication(endpoint.logout), userService.logout);
router.post("/refresh-token",authentication(endpoint.refreshToken, TokenEnum.REFRESH),userService.refreshToken);
router.post("/:userId/requestAddFriend",authentication(endpoint.requestAddFriend, TokenEnum.ACCESS) , validation(validators.requestAddFriendSchema),userService.requestAddFriend);
router.post("/:requestId/accept",authentication(endpoint.accept, TokenEnum.ACCESS) , validation(validators.requestAddFriendSchema),userService.acceptRequest);

export default router;
