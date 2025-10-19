import z from "zod";
import { generalFields } from "../../middlewares/validation.middleware";



export const getChatchema = {
    params: z.strictObject({
        userId: generalFields.id,
    }),
};

export const ChatSchema = {
    body: z.strictObject({
        participants: z.array(generalFields.id),
        group: z.string().min(2),
    }).superRefine((data, ctx) => {
        if (!data.participants?.length) {
            ctx.addIssue({
                code: "custom",
                path: ["participants"],
                message: "Please Provide participants",
            });
        }
    })
};


export const ChatGroupchema = {
    params: z.strictObject({
        groupId: generalFields.id,
    }),
};