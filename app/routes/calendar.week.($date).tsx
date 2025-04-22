import { redirect } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import {
  add,
  endOfWeek,
  format,
  parse,
  startOfWeek,
  sub,
  startOfDay,
  endOfDay,
} from "date-fns";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import type { LoaderFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { LinkButton } from "~/components/Button";
import { EventCard } from "~/components/EventCard";
import { styled, Flex, Spacer, Box } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { TrackStatus } from "@prisma/client";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.date) {
    const today = format(new Date(), "dd-MM-yy");
    throw redirect(`/calendar/week/${today}`);
  }

  const date = parse(params.date, "dd-MM-yy", new Date());

  const events = await prisma.events.findMany({
    where: {
      approved: true,
      eventTrack: {
        status: TrackStatus.ACTIVE,
      },
      AND: [
        {
          startDate: {
            lte: endOfWeek(date, {
              weekStartsOn: 1,
            }),
          },
        },
        {
          endDate: {
            gte: startOfWeek(date, {
              weekStartsOn: 1,
            }),
          },
        },
      ],
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
          const dayEvents = events.filter(
            (event) =>
              startOfDay(new Date(event.endDate)) >= startOfDay(day) &&
              startOfDay(new Date(event.startDate)) <= endOfDay(day)
          );

          return (
            <Box
              key={i}
              rounded="2xl"
              overflow="hidden"
              borderWidth={1}
              borderColor="gray.900"
            >
              <Box py={1} px={4} bgColor="gray.900">
                <styled.h3 fontWeight="bold">
                  {format(day, "EEEE do")}
                </styled.h3>
              </Box>

              <Flex p={4} flexDir="column" gap={2}>
                {dayEvents.length <= 0 && (
                  <styled.p fontSize="sm">No Events...</styled.p>
                )}

                {dayEvents.map((event) => (
                  <EventCard key={event.id} event={event} showAvatar />
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
