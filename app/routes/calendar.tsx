import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { Outlet, useLocation, useParams } from "react-router";
import { endOfWeek, format, isThisWeek, parse, startOfWeek } from "date-fns";
import { Tab } from "~/components/Tab";
import { Container, Spacer, styled } from "~/styled-system/jsx";
import type { Route } from "./+types/calendar";
import { TabsBar } from "~/components/TabsBar";

export const meta: Route.MetaFunction = ({ params }) => {
  const today = format(new Date(), "dd-MM-yy");
  const dateParam = params.date ?? today;
  const date = parse(dateParam, "dd-MM-yy", new Date());
  const thisWeek = isThisWeek(date, {
    weekStartsOn: 1,
  });

  return [
    { title: "RC Drift UK | Calendar" },
    {
      name: "description",
      content:
        "All of the RC Drifting events from across the world in one calendar.",
    },
    {
      property: "og:image",
      content: thisWeek
        ? "https://rcdrift.uk/thisweek-og-image.png"
        : "https://rcdrift.uk/og-image.jpg",
    },
  ];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const url = new URL(request.url);

  if (
    url.pathname === "/calendar" ||
    url.pathname === "/calendar/" ||
    !args.params.date
  ) {
    const today = format(new Date(), "dd-MM-yy");
    throw redirect(`/calendar/week/${today}`);
  }

  const date = parse(args.params.date, "dd-MM-yy", new Date());

  return { date };
};

const CalendarPage = () => {
  const { date } = useLoaderData<typeof loader>();
  const location = useLocation();
  const params = useParams();
  const today = format(new Date(), "dd-MM-yy");
  const dateParam = params.date ?? today;
  const increment = location.pathname.includes("/day")
    ? "day"
    : location.pathname.includes("/week")
      ? "week"
      : "month";

  const startWeekDate = startOfWeek(date, {
    weekStartsOn: 1,
  });
  const endWeekDate = endOfWeek(date, {
    weekStartsOn: 1,
  });

  const getDate = () => {
    if (increment === "day") {
      return format(date, "EEEE do MMMM, yyyy");
    }

    if (increment === "week") {
      return `${format(startWeekDate, "do")}-${format(endWeekDate, "do MMMM, yyyy")}`;
    }

    if (increment === "month") {
      return format(date, "MMMM, yyyy");
    }
  };

  return (
    <>
      <TabsBar>
        <styled.span>{getDate()}</styled.span>
        <Spacer />
        <Tab
          isActive={location.pathname.includes("/calendar/day")}
          to={`/calendar/day/${dateParam}`}
          replace
        >
          Day
        </Tab>
        <Tab
          isActive={location.pathname.includes("/calendar/week")}
          to={`/calendar/week/${dateParam}`}
          replace
        >
          Week
        </Tab>
        <Tab
          isActive={location.pathname.includes("/calendar/month")}
          to={`/calendar/month/${dateParam}`}
          replace
        >
          Month
        </Tab>
      </TabsBar>

      <Container px={2} maxW={1100} py={2}>
        <Outlet />
      </Container>
    </>
  );
};

export default CalendarPage;
