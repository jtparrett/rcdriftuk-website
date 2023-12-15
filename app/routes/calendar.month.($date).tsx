import { redirect } from "@remix-run/node";
import { Link, useLoaderData, useParams } from "@remix-run/react";
import {
  add,
  differenceInDays,
  endOfMonth,
  format,
  getDaysInMonth,
  isSameDay,
  parse,
  startOfMonth,
  startOfWeek,
  sub,
} from "date-fns";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs/index.js";
import { LoaderFunctionArgs } from "react-router";
import invariant from "tiny-invariant";
import { LinkButton } from "~/components/Button";
import { styled, Flex, Spacer, Box, Center } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

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
      approved: true,
      startDate: {
        gte: startOfMonth(date),
        lte: endOfMonth(date),
      },
    },
  });

  return events;
};

const CalendarMonthsPage = () => {
  const params = useParams();
  const events = useLoaderData<typeof loader>();

  invariant(params.date);

  const date = parse(params.date, "dd-MM-yy", new Date());
  const monthStartDate = startOfMonth(date);

  return (
    <>
      <Flex gap={2}>
        <styled.h1 fontWeight="bold" alignSelf="center">
          {format(date, "MMMM, yyyy")}
        </styled.h1>
        <Spacer />
        <LinkButton
          size="sm"
          variant="secondary"
          to={`/calendar/month/${format(sub(date, { months: 1 }), "dd-MM-yy")}`}
        >
          <BsChevronLeft />
        </LinkButton>
        <LinkButton
          size="sm"
          variant="secondary"
          to={`/calendar/month/${format(new Date(), "dd-MM-yy")}`}
        >
          Today
        </LinkButton>
        <LinkButton
          size="sm"
          variant="secondary"
          to={`/calendar/month/${format(add(date, { months: 1 }), "dd-MM-yy")}`}
        >
          <BsChevronRight />
        </LinkButton>
      </Flex>

      <Flex flexWrap="wrap" py={2} ml={-1}>
        {Array.from(
          new Array(
            differenceInDays(
              monthStartDate,
              startOfWeek(monthStartDate, {
                weekStartsOn: 1,
              })
            )
          )
        ).map((_, i) => (
          <Box key={i} w={`${100 / 7}%`}></Box>
        ))}

        {Array.from(new Array(getDaysInMonth(monthStartDate))).map((_, i) => {
          const day = add(monthStartDate, {
            days: i,
          });

          const dayEvents = events.filter((event) =>
            isSameDay(new Date(event.startDate), day)
          );

          return (
            <Box key={i} w={`${100 / 7}%`} pl={1} mb={1}>
              <Box
                bgColor="gray.900"
                pos="relative"
                rounded="sm"
                overflow="hidden"
              >
                <Box
                  fontSize={{ base: "11px", md: "sm" }}
                  textAlign="center"
                  bgColor="gray.800"
                  borderBottomWidth={1}
                  borderColor="gray.700"
                  py={1}
                >
                  <styled.h3 whiteSpace="nowrap">
                    {format(day, "E do")}
                  </styled.h3>
                </Box>

                <LinkOverlay to={`/calendar/day/${format(day, "dd-MM-yy")}`} />

                <Center aspectRatio={1}>
                  {dayEvents.length > 0 && (
                    <Center
                      w="50%"
                      aspectRatio={1}
                      bgColor="brand.500"
                      rounded="full"
                      fontWeight="bold"
                      fontSize="xs"
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
    </>
  );
};

export default CalendarMonthsPage;
