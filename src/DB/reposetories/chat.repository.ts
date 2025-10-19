import { Model } from "mongoose";
import { DatabaseRepository } from "./database.repository";
import { IChat } from "../models/chat.model";

export class chatRepository extends DatabaseRepository<IChat> {
  constructor(protected override readonly model: Model<IChat>) {
    super(model);
  }
}
