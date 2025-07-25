import { TrackStatus } from "~/utils/enums";
import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { Link, useLoaderData } from "react-router";
import {
  add,
  differenceInDays,
  endOfMonth,
  format,
  getDaysInMonth,
  parse,
  startOfMonth,
  startOfWeek,
  startOfDay,
  endOfDay,
} from "date-fns";
import { styled, Box, Flex, Center } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { toZonedTime } from "date-fns-tz";

const LinkOverlay = styled(Link, {
  base: {
    position: "absolute",
    inset: 0,
    zIndex: 2,
  },
});

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
  });

  return { events, date };
};

const Page = () => {
  const { events, date } = useLoaderData<typeof loader>();
  const monthStartDate = startOfMonth(date);

  return (
    <Flex flexWrap="wrap" py={2} ml={-1}>
      {Array.from(
        new Array(
          differenceInDays(
            monthStartDate,
            startOfWeek(monthStartDate, {
              weekStartsOn: 1,
            }),
          ),
        ),
      ).map((_, i) => (
        <Box key={i} w={`${100 / 7}%`}></Box>
      ))}

      {Array.from(new Array(getDaysInMonth(monthStartDate))).map((_, i) => {
        const day = add(monthStartDate, {
          days: i,
        });

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
          <Box key={i} w={`${100 / 7}%`} pl={1} mb={1}>
            <Box
              pos="relative"
              rounded="md"
              overflow="hidden"
              borderWidth={1}
              borderColor="gray.800"
            >
              <Box
                fontSize={{ base: "11px", md: "sm" }}
                textAlign="center"
                bgColor="gray.800"
                py={1}
              >
                <styled.h3
                  whiteSpace="nowrap"
                  fontWeight="medium"
                  fontSize={{ base: "xs", md: "sm" }}
                >
                  {format(day, "E do")}
                </styled.h3>
              </Box>

              <LinkOverlay to={`/calendar/day/${format(day, "dd-MM-yy")}`} />

              <Center aspectRatio={1}>
                {dayEvents.length > 0 && (
                  <Center
                    w="50%"
                    aspectRatio={1}
                    bgColor="gray.800"
                    rounded="full"
                    fontWeight="bold"
                    fontSize={{ base: "xs", md: "xl" }}
                  >
                    {dayEvents.length}
                  </Center>
                )}
              </Center>
            </Box>
          </Box>
        );
      })}
    </Flex>
  );
};

export default Page;
