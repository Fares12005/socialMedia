import { Router } from "express";
import authService from "./auth.service";
import { validation } from "../../middlewares/validation.middleware";
import {
  confirmEmailSchema,
  loginSchema,
  signUpSchema,
} from "./auth.validation";
import { authentication } from "../../middlewares/authentication.middleware";
import {
  cloudFileUplaod,
  fileValidation,
  StorageEnum,
} from "../../utils/multer/cloud.multer";
import { endpoint } from "./auth.authorization";
import { TokenEnum } from "../../utils/security/token";
const router: Router = Router();

router.post("/signup", validation(signUpSchema), authService.signUp);
router.post("/login", validation(loginSchema), authService.login);
router.patch("/profile-image",authentication(endpoint.image, TokenEnum.ACCESS),cloudFileUplaod({storageApproch: StorageEnum.MEMORY,validation: fileValidation.images,maxsize: 2,}).single("attachment"),authService.profileImage);
router.patch("/profile-cover-image",authentication(endpoint.image, TokenEnum.ACCESS),cloudFileUplaod({storageApproch: StorageEnum.DISK,validation: fileValidation.images,maxsize: 2,}).array("attachments", 5),authService.covetImages);
router.patch("/confirm-email",validation(confirmEmailSchema),authService.confirmEmail);

export default router;
