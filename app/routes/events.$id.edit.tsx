import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { useLoaderData } from "react-router";
import { parseISO } from "date-fns";
import { z } from "zod";
import { styled, Container } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";
import { EventForm } from "~/components/EventForm";

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
      enableTicketing: true,
      ticketCapacity: true,
      ticketPrice: true,
      ticketReleaseDate: true,
      earlyAccessCode: true,
      allowedRanks: true,
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
      enableTicketing: z.string().nullish(),
      ticketCapacity: z.preprocess((v) => (v ? Number(v) : null), z.number().nullable()),
      ticketPrice: z.preprocess((v) => (v ? Number(v) : null), z.number().nullable()),
      ticketReleaseDate: z.preprocess((v) => (v ? new Date(v as string) : null), z.date().nullable()),
      earlyAccessCode: z.string().nullable(),
      allowedRanks: z.array(z.string()).default([]),
    })
    .parse({
      name: formData.get("name"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      link: formData.get("link"),
      description: formData.get("description"),
      rated: formData.get("rated"),
      enableTicketing: formData.get("enableTicketing"),
      ticketCapacity: formData.get("ticketCapacity"),
      ticketPrice: formData.get("ticketPrice"),
      ticketReleaseDate: formData.get("ticketReleaseDate"),
      earlyAccessCode: formData.get("earlyAccessCode"),
      allowedRanks: formData.getAll("allowedRanks"),
    });

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
      enableTicketing: data.enableTicketing === "true",
      ticketCapacity: data.ticketCapacity,
      ticketPrice: data.ticketPrice,
      ticketReleaseDate: data.ticketReleaseDate,
      earlyAccessCode: data.earlyAccessCode,
      allowedRanks: data.allowedRanks,
    },
  });

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
          enableTicketing: event.enableTicketing,
          ticketCapacity: event.ticketCapacity,
          ticketPrice: event.ticketPrice,
          ticketReleaseDate: event.ticketReleaseDate
            ? new Date(event.ticketReleaseDate)
            : null,
          earlyAccessCode: event.earlyAccessCode,
          allowedRanks: event.allowedRanks,
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
