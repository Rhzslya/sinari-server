import { ResponseError } from "../error/response-error";
import nodemailer from "nodemailer";
import {
  toContactUsResponse,
  type ContactUsRequest,
  type ContactUsResponse,
} from "../model/mail-model";
import { ContactValidation } from "../validation/contact-validation";
import { Validation } from "../validation/validation";
import { ZodError } from "zod";

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

  static async sendRestoredUser(email: string, name: string) {
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

    const info = await transporterTest.sendMail({
      from: `"Sinari Cell Admin" <${testAccount.user}>`,
      to: email,
      subject: "Account Restored",
      html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px dashed red;">
                <h3 style="color: red;">[THIS IS EMAIL TESTING]</h3>
                <h2>Halo, ${name}!</h2>
                <p>Halo, Akun anda telah dikembalikan, sekarang anda dapat masuk ke akun anda.</p>
            </div>
        `,
    });

    console.log("Message sent: %s", info.messageId);

    console.log("Email sent to %s. MessageId: %s", email, info.messageId);
  }

  // Tambahkan di dalam class Mail

  static async sendPasswordChangedNotification(email: string, name: string) {
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

      const info = await transporterTest.sendMail({
        from: `"Sinari Cell Security" <${testAccount.user}>`,
        to: email,
        subject: "Pemberitahuan Keamanan: Kata Sandi Anda Diubah",
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px dashed red;">
                <h3 style="color: red;">[THIS IS EMAIL TESTING]</h3>
                <h2>Halo, ${name}!</h2>
                <p>Kata sandi untuk akun Sinari Cell Anda baru saja diubah.</p>
                <p><strong>Jika ini adalah Anda:</strong> Anda bisa mengabaikan email ini.</p>
                <p style="color: red;"><strong>Jika Anda tidak melakukan perubahan ini:</strong> Segera lakukan reset kata sandi atau hubungi administrator karena akun Anda mungkin disalahgunakan.</p>
            </div>
        `,
      });

      console.log(
        "Security Email sent to %s. MessageId: %s",
        email,
        info.messageId,
      );
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (error) {
      console.error("Failed to send password change notification mail:", error);
    }
  }

  static async sendContactUsMail(request: ContactUsRequest): Promise<void> {
    try {
      const contactUsRequest = Validation.validate(
        ContactValidation.CONTACT_US,
        request,
      );
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

      const adminEmail = "sinaricell817@gmail.com";

      const info = await transporterTest.sendMail({
        from: `"Web Sinari Cell" <${testAccount.user}>`,
        to: adminEmail,
        replyTo: contactUsRequest.email,
        subject: `[Pesan Baru] ${contactUsRequest.subject}`,
        html: `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #334155;">
      <div style="background-color: #f8fafc; padding: 20px 24px; border-bottom: 1px solid #e2e8f0;">
        <div style="font-size: 12px; font-weight: bold; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Pesan Masuk Baru</div>
        <div style="font-size: 20px; font-weight: bold; color: #0f172a;">Konsultasi Web Sinari Cell</div>
      </div>

      <div style="padding: 24px;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; width: 120px; color: #64748b; font-weight: 500;">Nama Lengkap</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">: ${contactUsRequest.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Alamat Email</td>
            <td style="padding: 8px 0; font-weight: 600;">: <a href="mailto:${contactUsRequest.email}" style="color: #3b82f6; text-decoration: none;">${contactUsRequest.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">No. WhatsApp</td>
            <td style="padding: 8px 0; font-weight: 600;">: <span style="color: #10b981;">${contactUsRequest.phone_number}</span></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Subjek Pesan</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">: ${contactUsRequest.subject}</td>
          </tr>
        </table>

        <div style="margin-top: 24px; background-color: #f1f5f9; padding: 16px; border-radius: 6px; border-left: 4px solid #3b82f6;">
          <div style="font-size: 12px; color: #64748b; margin-bottom: 8px; font-weight: 500;">ISI PESAN:</div>
          <p style="margin: 0; font-size: 15px; line-height: 1.6; white-space: pre-wrap; color: #334155;">${contactUsRequest.message}</p>
        </div>

        <div style="margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 20px;">
          <div style="font-size: 12px; color: #64748b; margin-bottom: 12px; font-weight: bold; text-align: center;">TINDAKAN CEPAT (BALAS PESAN):</div>
          
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px; width: 50%; text-align: center;">
                <a href="https://wa.me/${contactUsRequest.phone_number}?text=Halo%20Kak%20${encodeURIComponent(contactUsRequest.name)}!%20%F0%9F%91%8B%0A%0ATerima%20kasih%20telah%20menghubungi%20Sinari%20Cell.%20Terkait%20kendala%20*${encodeURIComponent(contactUsRequest.subject)}*%20yang%20Kakak%20tanyakan%20di%20website%20kami%2C%20berikut%20adalah%20informasinya%3A%0A%0A..." 
                   style="display: block; background-color: #10b981; color: #ffffff; padding: 12px 10px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">
                   💬 Balas via WhatsApp
                </a>
              </td>
              <td style="padding: 5px; width: 50%; text-align: center;">
                <a href="mailto:${contactUsRequest.email}?subject=Balasan%20Tim%20Sinari%20Cell%3A%20${encodeURIComponent(contactUsRequest.subject)}&body=Halo%20${encodeURIComponent(contactUsRequest.name)}%2C%0A%0ATerima%20kasih%20telah%20menghubungi%20Sinari%20Cell." 
                   style="display: block; background-color: #3b82f6; color: #ffffff; padding: 12px 10px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">
                   📧 Balas via Email
                </a>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `,
      });

      console.log("Contact Email sent. MessageId: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (error) {
      if (error instanceof ZodError) {
        throw error;
      }
      console.error("Failed to send contact us mail:", error);
      throw new ResponseError(500, "Failed to send contact message");
    }
  }
}
