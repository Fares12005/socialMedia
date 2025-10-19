import { Server as httpServer } from "node:http"
import { Server, Socket } from "socket.io";
import { HUserDocumnet } from "../../DB/models/User.model";
import { JwtPayload } from "jsonwebtoken";
import { decodeToken, TokenEnum } from "../../utils/security/token";
import { Getaway } from "../chat/chat.getaway";


  let io: Server | null = null

export const intialize = (httpServer: httpServer) => {

    


  const io = new Server (httpServer)



  const connectedSockets = new Map<string, string[]>();


  interface IAuthSocket extends Socket {

    Credentials?: {

      user: Partial<HUserDocumnet>;
      decoded: JwtPayload;
    }



  }


  io.use( async ( socket: IAuthSocket, next ) => {
    try {
       const {user , decoded} = await decodeToken({
         authorization: socket.handshake.auth.token,
         tokenType: TokenEnum.ACCESS
       })

     const usertab =  connectedSockets.set(user._id.toString()) || []
     usertab.push(socket.id)
     connectedSockets.set(user._id.toString(), usertab)

       socket.Credentials = {user, decoded}
       next()
    } catch (error: any) {
      next(error)
      
    }
  })


const chatGetaway: Getaway = new Getaway()
  io.on("connection", (socket) => {
    console.log(socket);

    chatGetaway.register(socket , getio())

    socket.on("disconnect", () => {
      const userId = socket.Credentials?.user._id?.toString() as string;
      let remainingtap = connectedSockets.get(userId)?.filter((id) => { return id !== socket.id}) || []
      if(remainingtap.length){
        connectedSockets.set(userId, remainingtap)
      }else{
        connectedSockets.delete(userId)
      }
      connectedSockets.delete(socket.id)
    })
  })
}


export const getio = ():Server => {
  if(!io) throw new Error("Socket is not initialized")
  return io
}