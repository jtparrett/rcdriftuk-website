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
      enableTicketing: z.string().nullish(),
      ticketCapacity: z.preprocess((v) => (v ? Number(v) : null), z.number().nullable()),
      ticketReleaseDate: z.preprocess((v) => (v ? new Date(v as string) : null), z.date().nullable()),
      earlyAccessCode: z.string().nullable(),
      ticketPrice: z.preprocess((v) => (v ? Number(v) : null), z.number().nullable()),
      rated: z.string().optional(),
      allowedRanks: z.array(z.string()).default([]),
    })
    .parse({
      name: body.get("name"),
      startDate: body.get("startDate"),
      endDate: body.get("endDate"),
      link: body.get("link"),
      repeatWeeks: body.get("repeatWeeks"),
      description: body.get("description"),
      enableTicketing: body.get("enableTicketing"),
      ticketCapacity: body.get("ticketCapacity"),
      ticketReleaseDate: body.get("ticketReleaseDate"),
      earlyAccessCode: body.get("earlyAccessCode"),
      ticketPrice: body.get("ticketPrice"),
      rated: body.get("rated"),
      allowedRanks: body.getAll("allowedRanks"),
    });

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

  const [firstEvent] = await prisma.events.createManyAndReturn({
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
        enableTicketing: data.enableTicketing === "true",
        ticketCapacity: data.ticketCapacity,
        ticketReleaseDate: data.ticketReleaseDate
          ? data.ticketReleaseDate
          : null,
        earlyAccessCode: data.earlyAccessCode,
        ticketPrice: data.ticketPrice,
        rated: data.rated === "true",
        allowedRanks: data.allowedRanks,
      };
    }),
  });

  return redirect(`/events/${firstEvent.id}`);
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
