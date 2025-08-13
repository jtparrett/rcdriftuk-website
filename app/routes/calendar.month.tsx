import { useParams, Outlet, useLocation } from "react-router";
import { add, format, parse, sub } from "date-fns";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCalendarFill,
  RiListUnordered,
} from "react-icons/ri";
import invariant from "~/utils/invariant";
import { LinkButton } from "~/components/Button";
import { Flex, Spacer } from "~/styled-system/jsx";

const CalendarMonthsPage = () => {
  const params = useParams();
  const location = useLocation();

  invariant(params.date, "Date not found");

  const date = parse(params.date, "dd-MM-yy", new Date());
  const isListView = location.pathname.includes("/list");
  const basePath = isListView ? "/calendar/month/list" : "/calendar/month";

  return (
    <>
      <Flex gap={1}>
        <Spacer />

        <LinkButton
          to={`/calendar/month/${format(date, "dd-MM-yy")}`}
          size="sm"
          variant={isListView ? "outline" : "primary"}
        >
          <RiCalendarFill />
        </LinkButton>

        <LinkButton
          to={`/calendar/month/list/${format(date, "dd-MM-yy")}`}
          size="sm"
          variant={isListView ? "primary" : "outline"}
        >
          <RiListUnordered />
        </LinkButton>

        <LinkButton
          size="sm"
          variant="outline"
          to={`${basePath}/${format(sub(date, { months: 1 }), "dd-MM-yy")}`}
        >
          <RiArrowLeftSLine />
        </LinkButton>
        <LinkButton
          size="sm"
          variant="outline"
          to={`${basePath}/${format(new Date(), "dd-MM-yy")}`}
        >
          Today
        </LinkButton>
        <LinkButton
          size="sm"
          variant="outline"
          to={`${basePath}/${format(add(date, { months: 1 }), "dd-MM-yy")}`}
        >
          <RiArrowRightSLine />
        </LinkButton>
      </Flex>

      <Outlet />
    </>
  );
};

export default CalendarMonthsPage;
