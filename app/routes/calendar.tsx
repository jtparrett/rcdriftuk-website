import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Outlet, useLocation, useParams } from "@remix-run/react";
import { format, isThisWeek, parse } from "date-fns";
import { RiAddCircleFill } from "react-icons/ri";
import { LinkButton } from "~/components/Button";
import { Tab } from "~/components/Tab";
import { Flex, Spacer, Container, Box } from "~/styled-system/jsx";

export const meta: MetaFunction = ({ params }) => {
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
      content: "RCDrift.uk Calendar. All the events from across the UK.",
    },
    {
      property: "og:image",
      content: thisWeek
        ? "https://rcdrift.uk/thisweek-og-image.png"
        : "https://rcdrift.uk/rcdriftuk.svg",
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
    <>
      <Box mb={2} py={2} borderBottomWidth={1} borderColor="gray.800">
        <Container px={2} maxW={1100}>
          <Flex gap={2} alignItems="center">
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
              Create Event <RiAddCircleFill />
            </LinkButton>
          </Flex>
        </Container>
      </Box>

      <Container px={2} pb={100} maxW={1100}>
        <Outlet />
      </Container>
    </>
  );
};

export default CalendarPage;
