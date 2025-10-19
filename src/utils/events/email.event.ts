import { EventEmitter } from "node:events";
import Mail from "nodemailer/lib/mailer";
import { template } from "../email/sendEmail.template";
import { sendEmail } from "../email/send.email";

export const emailEvent = new EventEmitter();

interface IEmail extends Mail.Options {
  otp: number;
  username: string;
}

emailEvent.on("confirmEmail", async (data: IEmail) => {
  try {
    data.subject = "Confirm Your Email";
    data.html = template(data.otp, data.username, data.subject);
    await sendEmail(data);
  } catch (error) {
    console.log(`Fail To send email ${error}`);
  }
});
