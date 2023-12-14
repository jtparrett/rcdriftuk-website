import { redirect } from "@remix-run/node";
import { useParams } from "@remix-run/react";
import { add, format, parse, sub } from "date-fns";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs/index.js";
import { LoaderFunctionArgs } from "react-router";
import invariant from "tiny-invariant";
import { LinkButton } from "~/components/Button";
import { styled, Flex, Spacer } from "~/styled-system/jsx";

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
          to={`/calendar/day/${format(sub(date, { months: 1 }), "dd-MM-yy")}`}
        >
          <BsChevronLeft />
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
          to={`/calendar/day/${format(add(date, { months: 1 }), "dd-MM-yy")}`}
        >
          <BsChevronRight />
        </LinkButton>
      </Flex>

      <h1>Days</h1>
    </>
  );
};

export default CalendarMonthsPage;
