import { TicketStatus } from "@prisma/client";
import type { ActionFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { prisma } from "~/utils/prisma.server";
import { sendEmail } from "~/utils/resend.server";
import { stripe } from "~/utils/stripe.server";

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature");

  try {
    invariant(sig, "Missing stripe-signature header");
    invariant(
      process.env.STRIPE_WEBHOOK_SECRET,
      "Missing STRIPE_WEBHOOK_SECRET"
    );

    const event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const ticketId = session.metadata?.ticketId;

      const ticket = await prisma.eventTickets.findUniqueOrThrow({
        where: {
          id: Number(ticketId),
        },
        include: {
          event: {
            include: {
              eventTrack: true,
            },
          },
          user: true,
        },
      });

      // Check if the ticket has expired
      if (ticket.status === TicketStatus.CANCELLED) {
        // Refund the payment if reservation expired
        if (session.payment_intent) {
          await stripe.refunds.create({
            payment_intent: session.payment_intent as string,
          });
        }

        await prisma.eventTickets.update({
          where: {
            id: Number(ticketId),
          },
          data: {
            status: TicketStatus.REFUNDED,
          },
        });

        console.error("Reservation expired after payment succeeded.");
        return new Response("Payment refunded due to expiration.", {
          status: 400,
        });
      }

      // Update ticket status to confirmed
      await prisma.eventTickets.update({
        where: {
          id: Number(ticketId),
        },
        data: {
          status: TicketStatus.CONFIRMED,
        },
      });

      console.log("Sending email to", session);

      if (session.customer_email) {
        console.log("Sending email to", session.customer_email);
        await sendEmail(
          session.customer_email,
          `Your ticket for ${ticket.event.name}`,
          `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; margin-bottom: 24px;">Ticket Confirmed! 🎉</h1>
          
          ${ticket.event.cover ? `<img src="${ticket.event.cover}" alt="${ticket.event.name} cover" style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 24px;">` : ""}

          <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 16px;">
            Great news! Your ticket for <strong>${ticket.event.name}</strong> has been confirmed and paid for.
          </p>

          <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <h2 style="color: #333; font-size: 18px; margin-bottom: 12px;">Event Details</h2>
            <p style="color: #666; margin: 8px 0;">
              <strong>Event:</strong> ${ticket.event.name}<br>
              <strong>Date:</strong> ${new Date(ticket.event.startDate).toLocaleDateString()}<br>
              ${ticket.event.eventTrack ? `<strong>Location:</strong> ${ticket.event.eventTrack.name}<br>` : ""}
            </p>
          </div>

          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            We look forward to seeing you there! If you have any questions, please don't hesitate to contact us.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          
          <p style="color: #999; font-size: 14px;">
            This is an automated message from RC Drift UK. Please do not reply to this email.
          </p>
        </div>
        `
        );
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      const ticketId = session.metadata?.ticketId;

      await prisma.eventTickets.update({
        where: {
          id: Number(ticketId),
        },
        data: {
          status: TicketStatus.CANCELLED,
        },
      });
    }

    return new Response("Webhook received", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Webhook error", { status: 400 });
  }
}
