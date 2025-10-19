import type { Request, Response } from "express";
import { IChatDTO, IChatGroupDTO, IGetchatGroupDTO, IGroubChatDTO, ISayHaiDTO, ISendGroupMessageDTO, ISendMessageDTO } from "./chat.DTO";
import { chatRepository } from "../../DB/reposetories/chat.repository";
import { ChatModel } from "../../DB/models/chat.model";
import { UserRepository } from "../../DB/reposetories/user.repository";
import { UserModel } from "../../DB/models/User.model";
import { Types } from "mongoose";
import { v4 as uuid } from "uuid";




 export class ChatService {
    private _chatModel = new chatRepository(ChatModel);
    private _userModel = new UserRepository(UserModel);
    constructor() {}

    //Api

    getChat = async ( req:Request , res:Response ) => {

        const {userId} = req.params as IChatDTO

        const chat = await this._chatModel.findOne({filter:{participants:{ $all:[req.user?._id as Types.ObjectId , Types.ObjectId.createFromHexString(userId)]}, group:{$exists:false} , options:{populate:"participants"}}})
        if(!chat) throw new Error("Chat Not Found")
        return res.status(200).json({message:"Done" , chat})
    }

    ChatGroup = async ( req:Request , res:Response ) => {

        const { participants , group } = req.body as IChatGroupDTO

        const dpparticipants = participants.map((participants)=>{
            return Types.ObjectId.createFromHexString(participants)
        })


        const users = await this._userModel.findOne({filter:{_id:{$in:dpparticipants} , friends:{$in:[req.user?._id as Types.ObjectId]}}})

        if(dpparticipants.length !== users.length) throw new Error("please enter valid users")


            const roomId = uuid()

            const [newChat] = await this._chatModel.create({data:[{createdBy: req.user?._id as Types.ObjectId , group , participants: [...dpparticipants , req.user?._id as Types.ObjectId] , roomId}]}) || []

            if(!newChat) throw new Error("Chat Not Created")

            return res.status(200).json({message:"Done" , chat:newChat})


    }


    getChatGroup = async ( req:Request , res:Response ) => {

        const { groupId } = req.params as IGetchatGroupDTO

          const chat = await this._chatModel.findOne({filter:{_id:Types.ObjectId.createFromHexString(groupId), group:{$exists:true} , participants:{$in:[req.user?._id as Types.ObjectId]} , options:{populate:"message.createdBy"}}})

            return res.status(200).json({message:"Done" , chat})


    }



    //io
    sayhai = ({message , socket , callback , io}:ISayHaiDTO) => {
        try {
            console.log(message);

             callback ? callback("i received your message") : undefined
            
        } catch (error) {

            socket.emit("error" , error)
            
            
        }
    }



    sendMessage = async ({content , sendto , socket , io}:ISendMessageDTO) => {
       try {
         const createdBy = socket.Credentials?.user?._id as Types.ObjectId
        const user = await this._userModel.findOne({filter:{_id:Types.ObjectId.createFromHexString(sendto), friends:{$in:[createdBy]}}})

        if(!user) throw new Error("User Not Found")

            const chat = await this._chatModel.findOneAndUpdate({filter:{participants:{ $all:[createdBy as Types.ObjectId , Types.ObjectId.createFromHexString(sendto)]}, group:{$exists:false}}, update:{$addToSet:{messages:{content , createdBy}}}})

            if(!chat) {
             const [newCht] = (await this._chatModel.create({data:[{createdBy , messages:[{content , createdBy}], participants:[createdBy , Types.ObjectId.createFromHexString(sendto)]}]})) || [];

             if(!newCht) throw new Error("Chat Not Created")

            }

            io.emit("message" , {content})
            io.emit("message" , {content , from: socket.Credentials?.user})
            
        
       } catch (error) {
        socket.emit("error" , error)

       }
 
    }


    joinRoom = async ({roomId , socket , io}:IGroubChatDTO) => {
       try {
         
        const shat = await this._chatModel.findOne({filter:{ roomId , group:{$exists:true} , participants:{$in:[socket.Credentials?.user?._id as Types.ObjectId]} , options:{populate:"message.createdBy"}}})

        if(!shat) throw new Error("Chat Not Found")
            
        socket.join(roomId as string)
        
       } catch (error) {
        socket.emit("error" , error)

       }
 
    }


    sendGroupMessage = async ({content , groupId , socket , io}:ISendGroupMessageDTO) => {
       try {
         
       const createdby = socket.Credentials?.user?._id as Types.ObjectId
       const chat = await this._chatModel.findOneAndUpdate({filter:{_id:Types.ObjectId.createFromHexString(groupId), group:{$exists:true} , participants:{$in:[createdby as Types.ObjectId ]}}, update:{$addToSet:{messages:{content , createdBy:createdby}}}})

       if(!chat) throw new Error("Chat Not Found")
            
        io.to(groupId).emit("message" , {content , from: socket.Credentials?.user})
        
       } catch (error) {
        socket.emit("error" , error)

       }
 
    }
}


export default new ChatService()