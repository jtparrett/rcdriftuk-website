import { LoaderFunctionArgs, MetaFunction, redirect } from "@remix-run/node";
import { Outlet, useLocation, useParams } from "@remix-run/react";
import { format } from "date-fns";
import { LinkButton } from "~/components/Button";
import { Tab } from "~/components/Tab";
import { styled, Box, Flex, Spacer } from "~/styled-system/jsx";

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

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (
    !params.date &&
    !(url.pathname === "/calendar/new" || url.pathname === "/calendar/success")
  ) {
    const today = format(new Date(), "dd-MM-yy");
    return redirect(`/calendar/day/${today}`);
  }

  return null;
};

const CalendarPage = () => {
  const location = useLocation();
  const params = useParams();
  const today = format(new Date(), "dd-MM-yy");
  const dateParam = params.date ?? today;

  return (
    <Box maxW={900} mx="auto" px={2}>
      <Box py={8}>
        <styled.img src="/rcdriftuk.svg" w={180} mx="auto" />
      </Box>
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
    </Box>
  );
};

export default CalendarPage;
