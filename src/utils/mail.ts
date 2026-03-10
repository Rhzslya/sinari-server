import { ResponseError } from "../error/response-error";
import nodemailer from "nodemailer";
import {
  type ContactUsRequest,
  type PasswordResetMailRequest,
  type UserNotificationRequest,
  type VerificationMailRequest,
} from "../model/mail-model";
import { ContactValidation } from "../validation/contact-validation";
import { Validation } from "../validation/validation";
import { ZodError } from "zod";

const PRIMARY_COLOR = "#ef473a";

export class Mail {
  private static async getTestTransporter() {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return { testAccount, transporter };
  }

  static async sendVerificationMail(request: VerificationMailRequest) {
    try {
      const { testAccount, transporter } = await this.getTestTransporter();
      const verificationUrl = `http://localhost:5173/auth/verify?token=${request.token}`;

      const info = await transporter.sendMail({
        from: `"Sinari Cell Admin" <${testAccount.user}>`,
        to: request.email,
        subject: "Verifikasi Alamat Email Anda",
        html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #334155;">
          <div style="background-color: #f8fafc; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; position: relative;">
            <span style="position: absolute; top: 10px; right: 10px; background: #fee2e2; color: #ef4444; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold;">TESTING</span>
            <div style="font-size: 12px; font-weight: bold; color: ${PRIMARY_COLOR}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Aksi Diperlukan</div>
            <div style="font-size: 20px; font-weight: bold; color: #0f172a;">Verifikasi Email Anda</div>
          </div>
          <div style="padding: 24px;">
            <p style="margin-top: 0; font-size: 16px;">Halo <strong>${request.name}</strong>,</p>
            <p style="line-height: 1.6;">Terima kasih telah mendaftar di Sinari Cell. Untuk menyelesaikan proses pendaftaran dan mengamankan akun Anda, silakan verifikasi alamat email ini.</p>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${verificationUrl}" style="display: inline-block; background-color: ${PRIMARY_COLOR}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">
                 Verifikasi Email Saya
              </a>
            </div>
            
            <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
              Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut ke browser Anda:<br>
              <a href="${verificationUrl}" style="color: ${PRIMARY_COLOR}; word-break: break-all;">${verificationUrl}</a>
            </p>
          </div>
        </div>
        `,
      });

      console.log("Verification Email sent. MessageId: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (error) {
      console.error("[MAIL ERROR DETAILS]:", error);
      throw new ResponseError(500, "Failed to send verification mail");
    }
  }

  static async sendPasswordResetMail(request: PasswordResetMailRequest) {
    try {
      const { testAccount, transporter } = await this.getTestTransporter();
      const passwordResetUrl = `http://localhost:5173/auth/reset-password?token=${request.token}`;

      const info = await transporter.sendMail({
        from: `"Sinari Cell Admin" <${testAccount.user}>`,
        to: request.email,
        subject: "Permintaan Reset Kata Sandi",
        html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #334155;">
          <div style="background-color: #f8fafc; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; position: relative;">
            <span style="position: absolute; top: 10px; right: 10px; background: #fee2e2; color: #ef4444; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold;">TESTING</span>
            <div style="font-size: 12px; font-weight: bold; color: ${PRIMARY_COLOR}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Keamanan Akun</div>
            <div style="font-size: 20px; font-weight: bold; color: #0f172a;">Reset Kata Sandi</div>
          </div>
          <div style="padding: 24px;">
            <p style="margin-top: 0; font-size: 16px;">Halo <strong>${request.name}</strong>,</p>
            <p style="line-height: 1.6;">Kami menerima permintaan untuk mereset kata sandi akun Sinari Cell Anda. Jika Anda tidak merasa melakukan permintaan ini, Anda bisa mengabaikan email ini.</p>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${passwordResetUrl}" style="display: inline-block; background-color: ${PRIMARY_COLOR}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">
                 Atur Ulang Kata Sandi
              </a>
            </div>
            
            <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
              Tautan ini hanya berlaku untuk waktu yang terbatas. Jika tautan kedaluwarsa, silakan minta reset kata sandi baru.
            </p>
          </div>
        </div>
        `,
      });

      console.log("Password Reset Email sent. MessageId: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (error) {
      console.error("[MAIL ERROR DETAILS]:", error);
      throw new ResponseError(500, "Failed to send password reset mail");
    }
  }

  static async sendRestoredUser(request: UserNotificationRequest) {
    try {
      const { testAccount, transporter } = await this.getTestTransporter();

      const info = await transporter.sendMail({
        from: `"Sinari Cell Admin" <${testAccount.user}>`,
        to: request.email,
        subject: "Pemberitahuan: Akun Anda Telah Dipulihkan",
        html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #334155;">
          <div style="background-color: #f8fafc; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; position: relative;">
            <span style="position: absolute; top: 10px; right: 10px; background: #fee2e2; color: #ef4444; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold;">TESTING</span>
            <div style="font-size: 12px; font-weight: bold; color: ${PRIMARY_COLOR}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Informasi Akun</div>
            <div style="font-size: 20px; font-weight: bold; color: #0f172a;">Akun Berhasil Dipulihkan</div>
          </div>
          <div style="padding: 24px;">
            <p style="margin-top: 0; font-size: 16px;">Halo <strong>${request.name}</strong>,</p>
            <p style="line-height: 1.6;">Kabar baik! Akun Sinari Cell Anda telah berhasil dikembalikan oleh administrator kami. Anda sekarang sudah dapat mengakses layanan kami seperti biasa.</p>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="http://localhost:5173/auth/login" style="display: inline-block; background-color: ${PRIMARY_COLOR}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">
                 Masuk ke Akun Sekarang
              </a>
            </div>
            
            <p style="font-size: 14px; color: #334155; line-height: 1.5; margin-bottom: 0;">
              Selamat datang kembali di Sinari Cell!
            </p>
          </div>
        </div>
        `,
      });

      console.log("Restore User Email sent. MessageId: %s", info.messageId);
    } catch (error) {
      console.error("Failed to send restored user mail:", error);
    }
  }

  static async sendPasswordChangedNotification(
    request: UserNotificationRequest,
  ) {
    try {
      const { testAccount, transporter } = await this.getTestTransporter();

      const info = await transporter.sendMail({
        from: `"Sinari Cell Security" <${testAccount.user}>`,
        to: request.email,
        subject: "Peringatan Keamanan: Kata Sandi Diubah",
        html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #334155;">
          <div style="background-color: #fef2f2; padding: 20px 24px; border-bottom: 1px solid #fecaca; position: relative;">
            <span style="position: absolute; top: 10px; right: 10px; background: #fee2e2; color: #ef4444; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold;">TESTING</span>
            <div style="font-size: 12px; font-weight: bold; color: #ef4444; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Peringatan Keamanan</div>
            <div style="font-size: 20px; font-weight: bold; color: #7f1d1d;">Perubahan Kata Sandi</div>
          </div>
          <div style="padding: 24px;">
            <p style="margin-top: 0; font-size: 16px;">Halo <strong>${request.name}</strong>,</p>
            <p style="line-height: 1.6;">Kami mendeteksi bahwa kata sandi untuk akun Sinari Cell Anda baru saja diubah.</p>
            
            <div style="margin-top: 24px; background-color: #f1f5f9; padding: 16px; border-radius: 6px; border-left: 4px solid #64748b;">
              <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Apakah ini Anda?</strong></p>
              <p style="margin: 0; font-size: 14px; color: #475569;">Jika Anda baru saja mengubah kata sandi, tidak ada tindakan lebih lanjut yang perlu dilakukan. Anda dapat mengabaikan pesan ini.</p>
            </div>

            <div style="margin-top: 16px; background-color: #fef2f2; padding: 16px; border-radius: 6px; border-left: 4px solid #ef4444;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #991b1b;"><strong>Jika ini bukan Anda:</strong></p>
              <p style="margin: 0; font-size: 14px; color: #991b1b;">Seseorang mungkin telah mengakses akun Anda tanpa izin. Segera lakukan pemulihan akun atau hubungi admin.</p>
            </div>
          </div>
        </div>
        `,
      });

      console.log("Security Email sent. MessageId: %s", info.messageId);
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
      const { testAccount, transporter } = await this.getTestTransporter();

      const adminEmail = "sinaricell817@gmail.com";

      const info = await transporter.sendMail({
        from: `"Web Sinari Cell" <${testAccount.user}>`,
        to: adminEmail,
        replyTo: contactUsRequest.email,
        subject: `[Pesan Baru] ${contactUsRequest.subject}`,
        html: `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #334155;">
      <div style="background-color: #f8fafc; padding: 20px 24px; border-bottom: 1px solid #e2e8f0;">
        <div style="font-size: 12px; font-weight: bold; color: ${PRIMARY_COLOR}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Pesan Masuk Baru</div>
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
            <td style="padding: 8px 0; font-weight: 600;">: <a href="mailto:${contactUsRequest.email}" style="color: ${PRIMARY_COLOR}; text-decoration: none;">${contactUsRequest.email}</a></td>
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

        <div style="margin-top: 24px; background-color: #f1f5f9; padding: 16px; border-radius: 6px; border-left: 4px solid ${PRIMARY_COLOR};">
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
                   style="display: block; background-color: ${PRIMARY_COLOR}; color: #ffffff; padding: 12px 10px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">
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
