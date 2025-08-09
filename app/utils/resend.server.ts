import { Resend } from "resend";
import invariant from "~/utils/invariant";

invariant(process.env.RESEND_API_KEY, "RESEND_API_KEY is not set");

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to: string, subject: string, html: string) => {
  await resend.emails.send({
    from: "info@rcdrift.uk",
    to,
    subject,
    html,
  });
};
