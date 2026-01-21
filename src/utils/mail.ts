import { ResponseError } from "../error/response-error";
import nodemailer from "nodemailer";

export class Mail {
  static async sendVerificationMail(
    email: string,
    token: string,
    name: string,
  ) {
    try {
      const testAccount = await nodemailer.createTestAccount();

      const transporterTest = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      // const transporter = nodemailer.createTransport({
      //   service: "gmail",
      //   auth: {
      //     user: process.env.MAIL_SENDER,
      //     pass: process.env.MAIL_PASSWORD,
      //   },
      // });

      const verificationUrl = `http://localhost:5173/auth/verify?token=${token}`;

      const info = await transporterTest.sendMail({
        from: `"Sinari Cell Admin" <${testAccount.user}>`,
        to: email,
        subject: "Verify your email address",
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px dashed red;">
                <h3 style="color: red;">[THIS IS EMAIL TESTING]</h3>
                <h2>Halo, ${name}!</h2>
                <p>Silakan klik tombol di bawah ini untuk verifikasi:</p>
                <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                  Verifikasi Email Saya
                </a>
            </div>
        `,
      });

      console.log("Message sent: %s", info.messageId);

      console.log("Email sent to %s. MessageId: %s", email, info.messageId);

      const previewUrl = nodemailer.getTestMessageUrl(info);

      console.log("Preview URL: %s", previewUrl);
    } catch (error) {
      throw new ResponseError(500, "Failed to send verification mail");
    }
  }

  static async sendPasswordResetMail(
    email: string,
    token: string,
    name: string,
  ) {
    const testAccount = await nodemailer.createTestAccount();

    const transporterTest = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const passwordResetUrl = `http://localhost:5173/auth/reset-password?token=${token}`;

    const info = await transporterTest.sendMail({
      from: `"Sinari Cell Admin" <${testAccount.user}>`,
      to: email,
      subject: "Reset your password",
      html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px dashed red;">
                <h3 style="color: red;">[THIS IS EMAIL TESTING]</h3>
                <h2>Halo, ${name}!</h2>
                <p>Silakan klik tombol di bawah ini untuk mengatur ulang password:</p>
                <a href="${passwordResetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                  Reset Password
                </a>
            </div>
        `,
    });

    console.log("Message sent: %s", info.messageId);

    console.log("Email sent to %s. MessageId: %s", email, info.messageId);

    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log("Preview URL: %s", previewUrl);
  }
}
