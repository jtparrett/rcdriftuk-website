import { TicketStatus } from "@prisma/client";
import type { ActionFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { prisma } from "~/utils/prisma.server";
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
