import { JwtPayload } from "jsonwebtoken";
import { HUserDocumnet } from "../../DB/models/User.model";

declare module "express-serve-static-core" {
  interface Request {
    user?: HUserDocumnet;
    decoded?: JwtPayload;
  }
}
