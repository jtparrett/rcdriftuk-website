import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { useLoaderData, useParams } from "react-router";
import {
  add,
  differenceInWeeks,
  endOfYear,
  parseISO,
} from "date-fns";
import invariant from "~/utils/invariant";
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
  const { userId } = await getAuth(args);
  const slug = z.string().parse(params.slug);

  if (!userId) {
    throw redirect("/");
  }

  const track = await prisma.tracks.findFirst({
    where: {
      slug,
      Owners: {
        some: {
          userId,
        },
      },
    },
    select: {
      stripeAccountEnabled: true,
    },
  });

  if (!track) {
    throw redirect("/");
  }

  return { stripeAccountEnabled: track.stripeAccountEnabled };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request, params } = args;
  const { userId } = await getAuth(args);
  const body = await request.formData();
  const slug = z.string().parse(params.slug);

  invariant(userId, "User not found");

  const data = z
    .object({
      name: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      link: z.string().optional(),
      repeatWeeks: z.coerce.number(),
      description: z.string().optional(),
      ticketCapacity: z.preprocess(
        (v) => (v ? Number(v) : null),
        z.number().nullable(),
      ),
      ticketTypes: z.string().default("[]"),
      rated: z.string().optional(),
    })
    .parse({
      name: body.get("name"),
      startDate: body.get("startDate"),
      endDate: body.get("endDate"),
      link: body.get("link"),
      repeatWeeks: body.get("repeatWeeks"),
      description: body.get("description"),
      ticketCapacity: body.get("ticketCapacity"),
      ticketTypes: body.get("ticketTypes"),
      rated: body.get("rated"),
    });

  const ticketTypes = ticketTypeSchema.parse(JSON.parse(data.ticketTypes));

  if (ticketTypes.length > 0 && (!data.ticketCapacity || data.ticketCapacity <= 0)) {
    throw new Response("Ticket capacity is required when ticket types are added", {
      status: 400,
    });
  }

  const startDateNoZone = parseISO(data.startDate);
  const endDateNoZone = parseISO(data.endDate);

  const track = await prisma.tracks.findFirstOrThrow({
    where: {
      slug,
      Owners: {
        some: {
          userId,
        },
      },
    },
  });

  const diff = differenceInWeeks(endOfYear(startDateNoZone), startDateNoZone);
  const arrayLength = data.repeatWeeks === 0 ? 1 : diff / data.repeatWeeks + 1;

  const events = await prisma.events.createManyAndReturn({
    data: Array.from({ length: arrayLength }).map((_, i) => {
      const repeatStartDate = add(startDateNoZone, {
        weeks: i * data.repeatWeeks,
      });
      const repeatEndDate = add(endDateNoZone, { weeks: i * data.repeatWeeks });

      return {
        name: data.name,
        trackId: track.id,
        link: data.link,
        startDate: repeatStartDate,
        endDate: repeatEndDate,
        description: data.description,
        ticketCapacity: data.ticketCapacity,
        rated: data.rated === "true",
      };
    }),
  });

  if (ticketTypes.length > 0) {
    const ticketTypeRecords = events.flatMap((event) =>
      ticketTypes.map((tt) => ({
        eventId: event.id,
        name: tt.name,
        price: parseFloat(tt.price),
        releaseDate: new Date(tt.releaseDate),
        allowedRanks: tt.allowedRanks,
      })),
    );

    await prisma.eventTicketTypes.createMany({
      data: ticketTypeRecords,
    });
  }

  return redirect(`/events/${events[0].id}`);
};

const CalendarNewPage = () => {
  const { stripeAccountEnabled } = useLoaderData<typeof loader>();
  const params = useParams();

  return (
    <Container maxW={1100} px={4} py={8}>
      <styled.h1 fontSize="3xl" fontWeight="extrabold" mb={4}>
        Create an event
      </styled.h1>
      <EventForm
        stripeAccountEnabled={stripeAccountEnabled}
        stripeSetupLink={`/edit/track/${params.slug}#payments`}
        showRepeatEvent
        submitLabel="Create Event"
      />
    </Container>
  );
};

export default CalendarNewPage;
