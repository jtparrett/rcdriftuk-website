import { redirect } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import {
  add,
  endOfWeek,
  format,
  isSameDay,
  parse,
  startOfWeek,
  sub,
} from "date-fns";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri/index.js";
import { LoaderFunctionArgs } from "react-router";
import invariant from "tiny-invariant";
import { LinkButton } from "~/components/Button";
import { EventCard } from "~/components/EventCard";
import { styled, Flex, Spacer, Box } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.date) {
    const today = format(new Date(), "dd-MM-yy");
    throw redirect(`/calendar/week/${today}`);
  }

  const date = parse(params.date, "dd-MM-yy", new Date());

  const events = await prisma.events.findMany({
    where: {
      approved: true,
      startDate: {
        gte: startOfWeek(date, {
          weekStartsOn: 1,
        }),
        lte: endOfWeek(date, {
          weekStartsOn: 1,
        }),
      },
    },
    orderBy: {
      startDate: "asc",
    },
    include: {
      eventTrack: true,
    },
  });

  return events;
};

const CalendarWeeksPage = () => {
  const params = useParams();
  const events = useLoaderData<typeof loader>();

  invariant(params.date);

  const date = parse(params.date, "dd-MM-yy", new Date());

  const startWeekDate = startOfWeek(date, {
    weekStartsOn: 1,
  });
  const endWeekDate = endOfWeek(date, {
    weekStartsOn: 1,
  });

  return (
    <>
      <Flex gap={2}>
        <styled.h1 fontWeight="bold" alignSelf="center">
          {format(startWeekDate, "do")}-{format(endWeekDate, "do MMMM, yyyy")}
        </styled.h1>
        <Spacer />
        <LinkButton
          size="sm"
          variant="secondary"
          to={`/calendar/week/${format(sub(date, { weeks: 1 }), "dd-MM-yy")}`}
        >
          <RiArrowLeftSLine />
        </LinkButton>
        <LinkButton
          size="sm"
          variant="secondary"
          to={`/calendar/week/${format(new Date(), "dd-MM-yy")}`}
        >
          Today
        </LinkButton>
        <LinkButton
          size="sm"
          variant="secondary"
          to={`/calendar/week/${format(add(date, { weeks: 1 }), "dd-MM-yy")}`}
        >
          <RiArrowRightSLine />
        </LinkButton>
      </Flex>

      <Flex py={2} flexDir="column" gap={2}>
        {Array.from(new Array(7)).map((_, i) => {
          const day = add(startWeekDate, { days: i });
          const dayEvents = events.filter((event) =>
            isSameDay(new Date(event.startDate), day)
          );

          return (
            <Box key={i} rounded="sm" overflow="hidden" bgColor="gray.900">
              <Box
                p={1}
                textAlign="center"
                bgColor="gray.800"
                borderBottomWidth={1}
                borderColor="gray.700"
              >
                <styled.h3>{format(day, "EEEE do")}</styled.h3>
              </Box>

              <Flex p={4} flexDir="column" gap={2}>
                {dayEvents.length <= 0 && <styled.p>No Events...</styled.p>}

                {dayEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </Flex>
            </Box>
          );
        })}
      </Flex>
    </>
  );
};

export default CalendarWeeksPage;
