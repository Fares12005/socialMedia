import { Router } from "express";
import commentService from "./comment.service";
import { authentication } from "../../middlewares/authentication.middleware";
import { endpoint } from "./comment.authorization";
import { TokenEnum } from "../../utils/security/token";
import { validation } from "../../middlewares/validation.middleware";
import * as validators from "./comment.validation";
import {
  cloudFileUplaod,
  fileValidation,
} from "../../utils/multer/cloud.multer";
const router: Router = Router({
  mergeParams: true,
});

router.post("/",authentication(endpoint.createComment, TokenEnum.ACCESS),cloudFileUplaod({ validation: fileValidation.images }).array("attachments",3),validation(validators.createCommentSchema),commentService.createComment);
router.post("/:postId/comment/:commentId/reply", authentication(endpoint.createComment, TokenEnum.ACCESS),cloudFileUplaod({ validation: fileValidation.images }).array("attachments",3),validation(validators.createReplySchema),commentService.createCommentReply);
export default router;
