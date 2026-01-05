import { Regions, TrackStatus } from "~/utils/enums";
import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { useLoaderData } from "react-router";
import { endOfMonth, format, parse, startOfMonth } from "date-fns";
import { EventCard } from "~/components/EventCard";
import { styled, Flex } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import z from "zod";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.date) {
    const today = format(new Date(), "dd-MM-yy");
    throw redirect(`/calendar/${params.region}/month/${today}`);
  }

  const region = z.nativeEnum(Regions).safeParse(params.region?.toUpperCase());
  const date = parse(params.date, "dd-MM-yy", new Date());

  const listEvents = await prisma.events.findMany({
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
            lte: endOfMonth(date),
          },
        },
        {
          endDate: {
            gte: startOfMonth(date),
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

  return { listEvents };
};

const Page = () => {
  const { listEvents } = useLoaderData<typeof loader>();

  return (
    <Flex flexDir="column" gap={2} py={2}>
      {listEvents.length <= 0 && (
        <styled.p textAlign="center" py={8}>
          No Events...
        </styled.p>
      )}

      {listEvents.map((event) => (
        <EventCard key={event.id} event={event} showAvatar />
      ))}
    </Flex>
  );
};

export default Page;
