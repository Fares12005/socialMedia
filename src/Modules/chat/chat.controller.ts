import ChatService from "./chat.service";
import { Router } from "express";
import { authentication } from "../../middlewares/authentication.middleware";
import { endpoint } from "./chat.authorization";
import { TokenEnum } from "../../utils/security/token";
import { validation } from "../../middlewares/validation.middleware";
import * as validators from "./chat.validation";

const router = Router({mergeParams: true});


router.get(`/`, authentication(endpoint.getChat , TokenEnum.ACCESS) , validation(validators.getChatchema) ,ChatService.getChat);
router.get(`/chat-group`, authentication(endpoint.chatgroup , TokenEnum.ACCESS) , validation(validators.ChatSchema) ,ChatService.ChatGroup);
router.get(`/group/:groupId`, authentication(endpoint.chatgroup , TokenEnum.ACCESS) , validation(validators.ChatGroupchema) ,ChatService.getChatGroup);







export default router;



