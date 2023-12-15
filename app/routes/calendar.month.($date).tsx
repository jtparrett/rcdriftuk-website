import { redirect } from "@remix-run/node";
import { useParams } from "@remix-run/react";
import {
  add,
  differenceInDays,
  format,
  getDaysInMonth,
  parse,
  startOfMonth,
  startOfWeek,
  sub,
} from "date-fns";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs/index.js";
import { LoaderFunctionArgs } from "react-router";
import invariant from "tiny-invariant";
import { LinkButton } from "~/components/Button";
import { styled, Flex, Spacer, Box } from "~/styled-system/jsx";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.date) {
    const today = format(new Date(), "dd-MM-yy");
    return redirect(`/calendar/month/${today}`);
  }

  return null;
};

const CalendarMonthsPage = () => {
  const params = useParams();

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

      <Flex flexWrap="wrap" gap={1} py={2}>
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
          <Box key={i} w={`calc(${100 / 7}% - 4px)`}></Box>
        ))}

        {Array.from(new Array(getDaysInMonth(monthStartDate))).map((_, i) => {
          const day = add(monthStartDate, {
            days: i,
          });

          return (
            <Box
              key={i}
              w={`calc(${100 / 7}% - 4px)`}
              aspectRatio={1}
              bgColor="gray.900"
            >
              <Box
                fontSize="sm"
                textAlign="center"
                bgColor="gray.900"
                borderBottomWidth={1}
                borderColor="gray.800"
                py={1}
              >
                <styled.h3>{format(day, "E do")}</styled.h3>
              </Box>
            </Box>
          );
        })}
      </Flex>
    </>
  );
};

export default CalendarMonthsPage;
