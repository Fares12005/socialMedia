import {
  HydratedDocument,
  model,
  models,
  Schema,
  Types,
} from "mongoose";






export interface IFriendRequest {

    createdBy: Types.ObjectId;
    sendTo: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date
    acceptedAt?: Date

}

export const frindSchema = new Schema<IFriendRequest>(
  {
    createdBy:{
        type:Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
    sendTo:{
        type:Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
    createdAt: Date,
    updatedAt: Date,
    acceptedAt: Date
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);


export const Friendmodel = models.Friend || model<IFriendRequest>("Friend", );
export type HUserDocumnet = HydratedDocument<IFriendRequest>;
