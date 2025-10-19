import { Server } from "socket.io";
import { IAuthSocket } from "./chat.getaway";
import { ChatService } from "./chat.service";



export class chatEvents {
        private _chatService = new ChatService()
        constructor() {}



   sayhai = (socket: IAuthSocket , io: Server) => {
    return socket.on("sayhai" , (message , callback) => {
        this._chatService.sayhai({message , socket , callback , io})

        
    })
   }

   sendMessage = (socket: IAuthSocket , io: Server) => {
    return socket.on("sendMessage" , (data: {content: string , sendto:string}) => {
        this._chatService.sendMessage({...data , socket , io})
})

   }


   joinRoom = (socket: IAuthSocket , io: Server) => {
    return socket.on("joinRoom" , (data: {roomId: string}) => {
        this._chatService.joinRoom({...data , socket , io})
})

   }



   sendGroupMessage = (socket: IAuthSocket , io: Server) => {
    return socket.on("sendGroupMessage" , (data: {content: string , groupId: string}) => {
        this._chatService.sendGroupMessage({...data , socket , io})
})

   }
}