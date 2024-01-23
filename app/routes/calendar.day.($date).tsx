import { useLoaderData, useParams } from "@remix-run/react";
import { add, endOfDay, format, parse, startOfDay, sub } from "date-fns";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { LoaderFunctionArgs, redirect } from "react-router";
import invariant from "tiny-invariant";
import { LinkButton } from "~/components/Button";
import { EventCard } from "~/components/EventCard";
import { styled, Flex, Spacer } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.date) {
    const today = format(new Date(), "dd-MM-yy");
    throw redirect(`/calendar/day/${today}`);
  }

  const date = parse(params.date, "dd-MM-yy", new Date());

  const events = await prisma.events.findMany({
    where: {
      approved: true,
      startDate: {
        gte: startOfDay(date),
        lte: endOfDay(date),
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

const CalendarDaysPage = () => {
  const params = useParams();
  const events = useLoaderData<typeof loader>();

  invariant(params.date);

  const date = parse(params.date, "dd-MM-yy", new Date());

  return (
    <>
      <Flex gap={2}>
        <styled.h1 fontWeight="bold" alignSelf="flex-end">
          {format(date, "EEEE do MMMM, yyyy")}
        </styled.h1>
        <Spacer />
        <LinkButton
          size="sm"
          variant="secondary"
          to={`/calendar/day/${format(sub(date, { days: 1 }), "dd-MM-yy")}`}
        >
          <RiArrowLeftSLine />
        </LinkButton>
        <LinkButton
          size="sm"
          variant="secondary"
          to={`/calendar/day/${format(new Date(), "dd-MM-yy")}`}
        >
          Today
        </LinkButton>
        <LinkButton
          size="sm"
          variant="secondary"
          to={`/calendar/day/${format(add(date, { days: 1 }), "dd-MM-yy")}`}
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
