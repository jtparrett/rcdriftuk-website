import { useLoaderData } from "react-router";
import { add, endOfDay, format, parse, startOfDay, sub } from "date-fns";
import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { EventCard } from "~/components/EventCard";
import { styled, Flex } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { Regions, TrackStatus } from "~/utils/enums";
import { z } from "zod";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.date) {
    const today = format(new Date(), "dd-MM-yy");
    throw redirect(`/calendar/${params.region}/day/${today}`);
  }

  const region = z.nativeEnum(Regions).safeParse(params.region?.toUpperCase());
  const date = parse(params.date, "dd-MM-yy", new Date());

  const events = await prisma.events.findMany({
    where: {
      eventTrack: {
        status: TrackStatus.ACTIVE,
        ...(region.success && region.data !== Regions.ALL
          ? { region: region.data }
          : {}),
      },
      AND: [
        {
          startDate: {
            lte: endOfDay(date),
          },
        },
        {
          endDate: {
            gte: startOfDay(date),
          },
        },
      ],
    },
    include: {
      eventTrack: true,
    },
    orderBy: [
      {
        startDate: "asc",
      },
    ],
  });

  return { events, date, region: region.data };
};

const CalendarDaysPage = () => {
  const { events, date, region } = useLoaderData<typeof loader>();

  return (
    <Flex flexDir="column" gap={2} py={2}>
      {events.length <= 0 && (
        <styled.p textAlign="center" py={8}>
          No Events...
        </styled.p>
      )}

      {events.map((event) => (
        <EventCard key={event.id} event={event} showAvatar />
      ))}
    </Flex>
  );
};

export default CalendarDaysPage;
