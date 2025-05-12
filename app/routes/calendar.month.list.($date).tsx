import { TrackStatus } from "~/utils/enums";
import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { useLoaderData } from "react-router";
import { endOfMonth, format, parse, startOfMonth } from "date-fns";
import { EventCard } from "~/components/EventCard";
import { styled, Flex } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.date) {
    const today = format(new Date(), "dd-MM-yy");
    throw redirect(`/calendar/month/${today}`);
  }

  const date = parse(params.date, "dd-MM-yy", new Date());

  const events = await prisma.events.findMany({
    where: {
      eventTrack: {
        status: TrackStatus.ACTIVE,
      },
      startDate: {
        gte: startOfMonth(date),
        lte: endOfMonth(date),
      },
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

  return events;
};

const Page = () => {
  const events = useLoaderData<typeof loader>();

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

export default Page;
