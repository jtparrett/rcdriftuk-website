import { LoaderFunctionArgs, MetaFunction, redirect } from "@remix-run/node";
import { Outlet, useLocation, useParams } from "@remix-run/react";
import { format } from "date-fns";
import { LinkButton } from "~/components/Button";
import { Header } from "~/components/Header";
import { Tab } from "~/components/Tab";
import { Flex, Spacer, Container } from "~/styled-system/jsx";

export const meta: MetaFunction = () => {
  return [
    { title: "RC Drift UK | Calendar" },
    {
      name: "description",
      content: "RCDrift.uk Calendar. All the events from across the UK.",
    },
    {
      property: "og:image",
      content: "https://rcdrift.uk/rcdriftuk.svg",
    },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.pathname === "/calendar" || url.pathname === "/calendar/") {
    const today = format(new Date(), "dd-MM-yy");
    return redirect(`/calendar/week/${today}`);
  }

  return null;
};

const CalendarPage = () => {
  const location = useLocation();
  const params = useParams();
  const today = format(new Date(), "dd-MM-yy");
  const dateParam = params.date ?? today;

  return (
    <Container maxW={1100} px={2}>
      <Header />

      <Flex p={1} bgColor="gray.800" rounded="lg" gap={2} mb={2}>
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

        <Spacer />

        <LinkButton size="sm" to="/calendar/new">
          Add Event
        </LinkButton>
      </Flex>

      <Outlet />
    </Container>
  );
};

export default CalendarPage;
