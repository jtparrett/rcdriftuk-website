import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { Outlet, useLocation, useParams } from "react-router";
import { format, isThisWeek, parse } from "date-fns";
import { Tab } from "~/components/Tab";
import { Container } from "~/styled-system/jsx";
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

  if (url.pathname === "/calendar" || url.pathname === "/calendar/") {
    const today = format(new Date(), "dd-MM-yy");
    throw redirect(`/calendar/week/${today}`);
  }

  return null;
};

const CalendarPage = () => {
  const location = useLocation();
  const params = useParams();
  const today = format(new Date(), "dd-MM-yy");
  const dateParam = params.date ?? today;

  return (
    <>
      <TabsBar>
        <Tab
          isActive={location.pathname.includes("/calendar/day")}
          to={`/calendar/day/${dateParam}`}
        >
          Day
        </Tab>
        <Tab
          isActive={location.pathname.includes("/calendar/week")}
          to={`/calendar/week/${dateParam}`}
        >
          Week
        </Tab>
        <Tab
          isActive={location.pathname.includes("/calendar/month")}
          to={`/calendar/month/${dateParam}`}
        >
          Month
        </Tab>
      </TabsBar>

      <Container px={2} pb={100} maxW={1100} pt={2}>
        <Outlet />
      </Container>
    </>
  );
};

export default CalendarPage;
