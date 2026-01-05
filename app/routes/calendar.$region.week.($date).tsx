import { redirect } from "react-router";
import { useLoaderData } from "react-router";
import {
  add,
  endOfWeek,
  format,
  parse,
  startOfWeek,
  sub,
  startOfDay,
  endOfDay,
  isSameDay,
} from "date-fns";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import type { LoaderFunctionArgs } from "react-router";
import { LinkButton } from "~/components/Button";
import { EventCard } from "~/components/EventCard";
import { styled, Flex, Spacer, Box } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { Regions, TrackStatus } from "~/utils/enums";
import { toZonedTime } from "date-fns-tz";
import { z } from "zod";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.date) {
    const today = format(new Date(), "dd-MM-yy");
    throw redirect(`/calendar/${params.region}/week/${today}`);
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

  return { events, date, region: region.data };
};

const CalendarWeeksPage = () => {
  const { events, date, region } = useLoaderData<typeof loader>();

  const startWeekDate = startOfWeek(date, {
    weekStartsOn: 1,
  });

  return (
    <Box>
      <Flex gap={1}>
        <Spacer />

        <LinkButton
          size="sm"
          variant="outline"
          to={`/calendar/${region}/week/${format(sub(date, { weeks: 1 }), "dd-MM-yy")}`}
          data-replace="true"
          replace
        >
          <RiArrowLeftSLine />
        </LinkButton>
        <LinkButton
          size="sm"
          variant="outline"
          to={`/calendar/${region}/week/${format(new Date(), "dd-MM-yy")}`}
          data-replace="true"
          replace
        >
          Today
        </LinkButton>
        <LinkButton
          size="sm"
          variant="outline"
          to={`/calendar/${region}/week/${format(add(date, { weeks: 1 }), "dd-MM-yy")}`}
          data-replace="true"
          replace
        >
          <RiArrowRightSLine />
        </LinkButton>
      </Flex>

      <Flex py={2} flexDir="column" gap={2}>
        {Array.from(new Array(7)).map((_, i) => {
          const day = add(startWeekDate, { days: i });
          const isToday = isSameDay(day, new Date());
          const dayEvents = events.filter((event) => {
            const startDateUTC = toZonedTime(event.startDate, "UTC");
            const endDateUTC = toZonedTime(event.endDate, "UTC");

            return (
              (startOfDay(startDateUTC) >= startOfDay(day) &&
                endOfDay(endDateUTC) <= endOfDay(day)) ||
              (startOfDay(startDateUTC) <= startOfDay(day) &&
                endOfDay(endDateUTC) >= endOfDay(day))
            );
          });

          return (
            <Box
              key={i}
              rounded="2xl"
              overflow="hidden"
              borderWidth={1}
              borderColor={isToday ? "brand.500" : "gray.900"}
            >
              <Box py={1} px={4} bgColor={isToday ? "brand.500" : "gray.900"}>
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
    </Box>
  );
};

export default CalendarWeeksPage;
