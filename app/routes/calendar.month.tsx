import { useParams, Outlet, useLocation } from "@remix-run/react";
import { add, format, parse, sub } from "date-fns";
import {
  BsCalendar,
  BsChevronLeft,
  BsChevronRight,
  BsList,
} from "react-icons/bs/index.js";
import invariant from "tiny-invariant";
import { LinkButton } from "~/components/Button";
import { styled, Flex, Spacer } from "~/styled-system/jsx";

const CalendarMonthsPage = () => {
  const params = useParams();
  const location = useLocation();

  invariant(params.date);

  const date = parse(params.date, "dd-MM-yy", new Date());
  const isListView = location.pathname.includes("/list");
  const basePath = isListView ? "/calendar/month/list" : "/calendar/month";

  return (
    <>
      <Flex gap={2}>
        <styled.h1 fontWeight="bold" alignSelf="center">
          {format(date, "MMMM, yyyy")}
        </styled.h1>
        <Spacer />

        <LinkButton
          to={`/calendar/month/${format(date, "dd-MM-yy")}`}
          size="sm"
          variant={isListView ? "secondary" : "primary"}
        >
          <BsCalendar />
        </LinkButton>

        <LinkButton
          to={`/calendar/month/list/${format(date, "dd-MM-yy")}`}
          size="sm"
          variant={isListView ? "primary" : "secondary"}
        >
          <BsList />
        </LinkButton>

        <LinkButton
          size="sm"
          variant="secondary"
          to={`${basePath}/${format(sub(date, { months: 1 }), "dd-MM-yy")}`}
        >
          <BsChevronLeft />
        </LinkButton>
        <LinkButton
          size="sm"
          variant="secondary"
          to={`${basePath}/${format(new Date(), "dd-MM-yy")}`}
        >
          Today
        </LinkButton>
        <LinkButton
          size="sm"
          variant="secondary"
          to={`${basePath}/${format(add(date, { months: 1 }), "dd-MM-yy")}`}
        >
          <BsChevronRight />
        </LinkButton>
      </Flex>

      <Outlet />
    </>
  );
};

export default CalendarMonthsPage;
