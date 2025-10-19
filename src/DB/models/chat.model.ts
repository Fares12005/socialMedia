import { HydratedDocument, model, models, Schema, Types } from "mongoose";

export interface IMessage {
    content: string;
    createdBy: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface IChat {
    participants:Types.ObjectId[];
    messages:[{}];
    group?:string;
    group_Image?:string;
    roomId?:String;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt?: Date;
}
export type HchatDocumnet = HydratedDocument<IChat>;
export type HMessageDocumnet = HydratedDocument<IMessage>;

export const MessageSchema = new Schema<IMessage>({
    content: { type: String, required: true , minLength: 2, maxLength: 500000 },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
},{ timestamps: true });


export const chatSchema = new Schema<IChat>({
    participants: [{type:Schema.Types.ObjectId,required:true,ref:"User"}],
    group: String,
    group_Image: String,
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    roomId:{type:String , required: function (){ return this.roomId}},
    messages: [MessageSchema],

},{ timestamps: true });



export const ChatModel =
  models.Chat || model<IChat>("Chat", chatSchema);
