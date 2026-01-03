import { useLoaderData } from "react-router";
import { add, endOfDay, format, parse, startOfDay, sub } from "date-fns";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { LinkButton } from "~/components/Button";
import { EventCard } from "~/components/EventCard";
import { styled, Flex, Spacer } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { TrackStatus } from "~/utils/enums";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.date) {
    const today = format(new Date(), "dd-MM-yy");
    throw redirect(`/calendar/day/${today}`);
  }

  const date = parse(params.date, "dd-MM-yy", new Date());

  const events = await prisma.events.findMany({
    where: {
      eventTrack: {
        status: TrackStatus.ACTIVE,
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

  return { events, date };
};

const CalendarDaysPage = () => {
  const { events, date } = useLoaderData<typeof loader>();

  return (
    <>
      <Flex gap={1}>
        <Spacer />
        <LinkButton
          size="sm"
          variant="outline"
          to={`/calendar/day/${format(sub(date, { days: 1 }), "dd-MM-yy")}`}
          data-replace="true"
          replace
        >
          <RiArrowLeftSLine />
        </LinkButton>
        <LinkButton
          size="sm"
          variant="outline"
          to={`/calendar/day/${format(new Date(), "dd-MM-yy")}`}
          data-replace="true"
          replace
        >
          Today
        </LinkButton>
        <LinkButton
          size="sm"
          variant="outline"
          to={`/calendar/day/${format(add(date, { days: 1 }), "dd-MM-yy")}`}
          data-replace="true"
          replace
        >
          <RiArrowRightSLine />
        </LinkButton>
      </Flex>

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
    </>
  );
};

export default CalendarDaysPage;
