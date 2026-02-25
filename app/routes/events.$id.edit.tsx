import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { useLoaderData } from "react-router";
import { parseISO } from "date-fns";
import { z } from "zod";
import { styled, Container } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";
import { EventForm } from "~/components/EventForm";

const ticketTypeSchema = z.array(
  z.object({
    id: z.number().optional(),
    name: z.string(),
    price: z.string(),
    releaseDate: z.string(),
    allowedRanks: z.array(z.string()).default([]),
  }),
);

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const id = z.string().parse(params.id);
  const { userId } = await getAuth(args);

  if (!userId) {
    throw new Response(null, { status: 404, statusText: "Not Found" });
  }

  const event = await prisma.events.findFirst({
    where: {
      id,
      eventTrack: {
        Owners: {
          some: { userId },
        },
      },
    },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      link: true,
      description: true,
      rated: true,
      ticketCapacity: true,
      ticketTypes: {
        select: {
          id: true,
          name: true,
          price: true,
          releaseDate: true,
          allowedRanks: true,
        },
        orderBy: { releaseDate: "asc" },
      },
      eventTrack: {
        select: {
          stripeAccountEnabled: true,
        },
      },
    },
  });

  if (!event) {
    throw new Response(null, { status: 404, statusText: "Not Found" });
  }

  return { event };
};

export const action = async (args: ActionFunctionArgs) => {
  const { params } = args;
  const id = z.string().parse(params.id);
  const { userId } = await getAuth(args);

  if (!userId) {
    throw new Response(null, { status: 404, statusText: "Not Found" });
  }

  const event = await prisma.events.findFirst({
    where: {
      id,
      eventTrack: {
        Owners: {
          some: { userId },
        },
      },
    },
    include: {
      ticketTypes: { select: { id: true } },
    },
  });

  if (!event) {
    throw new Response(null, { status: 404, statusText: "Not Found" });
  }

  const formData = await args.request.formData();

  const data = z
    .object({
      name: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      link: z.string().optional(),
      description: z.string().optional(),
      rated: z.string().optional(),
      ticketCapacity: z.preprocess(
        (v) => (v ? Number(v) : null),
        z.number().nullable(),
      ),
      ticketTypes: z.string().default("[]"),
    })
    .parse({
      name: formData.get("name"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      link: formData.get("link"),
      description: formData.get("description"),
      rated: formData.get("rated"),
      ticketCapacity: formData.get("ticketCapacity"),
      ticketTypes: formData.get("ticketTypes"),
    });

  const ticketTypes = ticketTypeSchema.parse(JSON.parse(data.ticketTypes));

  if (ticketTypes.length > 0 && (!data.ticketCapacity || data.ticketCapacity <= 0)) {
    throw new Response("Ticket capacity is required when ticket types are added", {
      status: 400,
    });
  }

  const startDateParsed = parseISO(data.startDate);
  const endDateParsed = parseISO(data.endDate);

  await prisma.events.update({
    where: { id },
    data: {
      name: data.name,
      startDate: startDateParsed,
      endDate: endDateParsed,
      link: data.link,
      description: data.description,
      rated: data.rated === "true",
      ticketCapacity: data.ticketCapacity,
    },
  });

  const existingTypeIds = event.ticketTypes.map((t) => t.id);
  const incomingTypeIds = ticketTypes
    .filter((t) => t.id !== undefined)
    .map((t) => t.id!);

  const toDelete = existingTypeIds.filter(
    (id) => !incomingTypeIds.includes(id),
  );

  if (toDelete.length > 0) {
    await prisma.eventTickets.deleteMany({
      where: {
        ticketTypeId: { in: toDelete },
        status: { notIn: ["CONFIRMED"] },
      },
    });

    await prisma.eventTickets.updateMany({
      where: {
        ticketTypeId: { in: toDelete },
        status: "CONFIRMED",
      },
      data: { ticketTypeId: null },
    });

    await prisma.eventTicketTypes.deleteMany({
      where: { id: { in: toDelete } },
    });
  }

  for (const tt of ticketTypes) {
    if (tt.id) {
      await prisma.eventTicketTypes.update({
        where: { id: tt.id },
        data: {
          name: tt.name,
          price: parseFloat(tt.price),
          releaseDate: new Date(tt.releaseDate),
          allowedRanks: tt.allowedRanks,
        },
      });
    } else {
      await prisma.eventTicketTypes.create({
        data: {
          eventId: id,
          name: tt.name,
          price: parseFloat(tt.price),
          releaseDate: new Date(tt.releaseDate),
          allowedRanks: tt.allowedRanks,
        },
      });
    }
  }

  return redirect(`/events/${id}`);
};

const EventEditPage = () => {
  const { event } = useLoaderData<typeof loader>();

  return (
    <Container maxW={1100} px={4} py={8}>
      <styled.h1 fontSize="3xl" fontWeight="extrabold" mb={4}>
        Edit Event
      </styled.h1>
      <EventForm
        defaults={{
          name: event.name,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          link: event.link,
          description: event.description,
          rated: event.rated,
          ticketCapacity: event.ticketCapacity,
          ticketTypes: event.ticketTypes.map((t) => ({
            id: t.id,
            name: t.name,
            price: t.price,
            releaseDate: new Date(t.releaseDate),
            allowedRanks: t.allowedRanks,
          })),
        }}
        stripeAccountEnabled={
          event.eventTrack?.stripeAccountEnabled ?? false
        }
        submitLabel="Save Changes"
        cancelLink={`/events/${event.id}`}
      />
    </Container>
  );
};

export default EventEditPage;
