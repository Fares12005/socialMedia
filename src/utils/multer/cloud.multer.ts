import { Request } from "express";
import multer, { FileFilterCallback, Multer } from "multer";
import os from "node:os";
import { v4 as uuid } from "uuid";
import { BadRequestException } from "../response/error.response";
export enum StorageEnum {
  MEMORY = "MEMORY",
  DISK = "DISK",
}

export const fileValidation = {
  images: ["image/jpeg", "image/png", "image/jpg"],
  pdf: ["application/pdf"],
};

export const cloudFileUplaod = ({
  validation = [],
  storageApproch = StorageEnum.MEMORY,
  maxsize = 2,
}: {
  validation?: string[];
  storageApproch?: StorageEnum;
  maxsize?: number;
}): Multer => {
  const storage =
    storageApproch === StorageEnum.MEMORY
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: os.tmpdir(),
          filename: (req: Request, file: Express.Multer.File, cb) => {
            cb(null, `${uuid()}-${file.originalname}`);
          },
        });

  function fileFilter(
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) {
    if (!validation.includes(file.mimetype)) {
      return cb(new BadRequestException("Invalid File Type"));
    }
    return cb(null, true);
  }

  return multer({
    fileFilter,
    limits: { fileSize: maxsize * 1024 * 1024 },
    storage,
  });
};
