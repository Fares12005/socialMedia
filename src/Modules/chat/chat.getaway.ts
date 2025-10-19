import { Server, Socket } from "socket.io"
import { HUserDocumnet } from "../../DB/models/User.model";
import { JwtPayload } from "jsonwebtoken";
import { chatEvents } from "./chat.events";



 


export  class  Getaway {
    private _chatEvents = new chatEvents();
    constructor() {}

    register = (socket : IAuthSocket , io : Server) => {

        this._chatEvents.sayhai(socket , io);
        this._chatEvents.sendMessage(socket , io);
        this._chatEvents.joinRoom(socket , io);
        this._chatEvents.sendGroupMessage(socket , io);

    }
}



export interface IAuthSocket extends Socket {

    Credentials?: {

      user: Partial<HUserDocumnet>;
      decoded: JwtPayload;
    }

}