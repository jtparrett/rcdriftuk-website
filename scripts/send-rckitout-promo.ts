import "dotenv/config";
import { createClerkClient } from "@clerk/backend";
import { Resend } from "resend";
import { prisma } from "~/utils/prisma.server";
import clc from "cli-color";
import fs from "fs";
import path from "path";
import { startOfDay, sub } from "date-fns";

const EVENT_ID = "79d79e2f-784d-4a62-ba82-43e0bf8df3bf";
const DISCOUNT_CODE = "RCDIO26";
const LOGO_URL =
  "https://ngo12if6yyhjvs7m.public.blob.vercel-storage.com/rckitout.png";
const RCKITOUT_URL = "https://rckitout.com";

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

const resend = new Resend(process.env.RESEND_API_KEY!);

const buildEmailHtml = (firstName: string | null) => {
  const greeting = firstName ? `Hey ${firstName},` : "Hey,";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

          <!-- Dark header with RCKitout logo -->
          <tr>
            <td style="background-color: #111111; padding: 40px 40px 32px; text-align: center;">
              <img src="${LOGO_URL}" alt="RCKitout" width="280" style="display: block; margin: 0 auto; max-width: 280px; height: auto;" />
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px 40px 16px;">
              <p style="color: #27272a; font-size: 17px; line-height: 1.6; margin: 0 0 20px;">
                ${greeting}
              </p>
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Congratulations on securing your place at the <strong>RCDrift.io Spring Major</strong>! To celebrate, we've teamed up with <strong>RCKitout</strong> to bring you an exclusive discount.
              </p>
            </td>
          </tr>

          <!-- Discount code block -->
          <tr>
            <td style="padding: 0 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); border-radius: 12px; padding: 32px; text-align: center;">
                    <p style="color: #a1a1aa; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px; font-weight: 600;">
                      Your exclusive code
                    </p>
                    <p style="color: #ffffff; font-size: 36px; font-weight: 800; letter-spacing: 4px; margin: 0 0 12px; font-family: 'Courier New', monospace;">
                      ${DISCOUNT_CODE}
                    </p>
                    <div style="width: 40px; height: 2px; background-color: #e4e4e7; margin: 16px auto;"></div>
                    <p style="color: #d4d4d8; font-size: 18px; font-weight: 600; margin: 0;">
                      £5 off when you spend £20+
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA button -->
          <tr>
            <td style="padding: 32px 40px 16px; text-align: center;">
              <a href="${RCKITOUT_URL}" style="display: inline-block; background-color: #18181b; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 40px; border-radius: 8px; letter-spacing: 0.5px;">
                Shop RCKitout →
              </a>
            </td>
          </tr>

          <!-- Small print -->
          <tr>
            <td style="padding: 16px 40px 40px;">
              <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
                Use code <strong>${DISCOUNT_CODE}</strong> at checkout on <a href="${RCKITOUT_URL}" style="color: #71717a; text-decoration: underline;">rckitout.com</a>. Minimum spend of £20 required.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #f4f4f5;">
              <p style="color: #a1a1aa; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                You're receiving this because you purchased a ticket via <a href="https://rcdrift.io" style="color: #71717a; text-decoration: underline;">rcdrift.io</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const run = async () => {
  const shouldSend = process.argv.includes("--send");

  console.log(clc.cyan("\n📦 Fetching confirmed tickets for event...\n"));

  const tickets = await prisma.eventTickets.findMany({
    where: {
      eventId: EVENT_ID,
      status: "CONFIRMED",
      userId: { not: null },
      createdAt: {
        gte: startOfDay(sub(new Date(), { days: 3 })),
      },
    },
    include: {
      event: { select: { name: true } },
      user: { select: { firstName: true, lastName: true, id: true } },
    },
  });

  if (tickets.length === 0) {
    console.log(clc.yellow("No confirmed tickets found for this event."));
    return;
  }

  console.log(
    clc.green(
      `Found ${tickets.length} confirmed ticket(s) for: ${tickets[0].event.name}\n`,
    ),
  );

  const recipients: {
    email: string;
    firstName: string | null;
    userId: string;
  }[] = [];

  for (const ticket of tickets) {
    if (!ticket.userId) continue;

    try {
      const clerkUser = await clerk.users.getUser(ticket.userId);
      const email = clerkUser.emailAddresses?.[0]?.emailAddress;

      if (email) {
        recipients.push({
          email,
          firstName: ticket.user?.firstName ?? clerkUser.firstName,
          userId: ticket.userId,
        });
        console.log(
          clc.white(
            `  ✓ ${ticket.user?.firstName ?? "?"} ${ticket.user?.lastName ?? ""} → ${email}`,
          ),
        );
      } else {
        console.log(
          clc.yellow(
            `  ⚠ No email for ${ticket.user?.firstName ?? "?"} ${ticket.user?.lastName ?? ""} (${ticket.userId})`,
          ),
        );
      }
    } catch (err) {
      console.log(
        clc.red(`  ✗ Failed to fetch Clerk user ${ticket.userId}: ${err}`),
      );
    }
  }

  console.log(
    clc.cyan(`\n${recipients.length} recipient(s) with email addresses.\n`),
  );

  // Always save a preview
  const previewHtml = buildEmailHtml("Driver");
  const previewPath = path.join(
    process.cwd(),
    "scripts",
    "rckitout-promo-preview.html",
  );
  fs.writeFileSync(previewPath, previewHtml);
  console.log(clc.white(`Preview saved to: ${previewPath}`));
  console.log(clc.white(`Open it in your browser to check the design.\n`));

  if (!shouldSend) {
    console.log(clc.yellow("DRY RUN — no emails sent."));
    console.log(clc.yellow("Run with --send flag to actually send emails.\n"));
    return;
  }

  console.log(clc.cyan("Sending emails...\n"));

  let sent = 0;
  let failed = 0;

  for (const [i, r] of recipients.entries()) {
    try {
      await resend.emails.send({
        from: "info@rcdrift.io",
        to: r.email,
        subject:
          "RCDrift.io Spring Major — Your exclusive RCKitout discount 🏎️",
        html: buildEmailHtml(r.firstName),
      });
      console.log(
        clc.green(`  ✓ Sent to ${r.email} (${i + 1}/${recipients.length})`),
      );
      sent++;
    } catch (err) {
      console.log(clc.red(`  ✗ Failed to send to ${r.email}: ${err}`));
      failed++;
    }

    if (i < recipients.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }

  console.log(clc.bgGreen(`\nDone! Sent: ${sent}, Failed: ${failed}\n`));
};

run()
  .catch((err) => {
    console.error(clc.red("Error:"), err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
