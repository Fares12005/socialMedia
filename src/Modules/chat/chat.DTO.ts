import z from "zod";
import { IAuthSocket } from "./chat.getaway";
import { ChatGroupchema, ChatSchema, getChatchema } from "./chat.validation";
import { Server } from "socket.io";



export interface ISayHaiDTO {
    message : string;
    socket : IAuthSocket;
    callback : any;
    io : Server
}


export interface ISendMessageDTO {
    content : any;
    socket : IAuthSocket;
    sendto : any;
    io : Server
}

export interface IGroubChatDTO {
    roomId : any;
    socket : IAuthSocket;
    io : Server
}


export interface ISendGroupMessageDTO {
    content : any;
    groupId : any;
    socket : IAuthSocket;
    io : Server
}




export type IChatDTO = z.infer<typeof getChatchema.params>;
export type IChatGroupDTO = z.infer<typeof ChatSchema.body>;
export type IGetchatGroupDTO = z.infer<typeof ChatGroupchema.params>;
