import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Outlet, useLocation } from "@remix-run/react";
import { format } from "date-fns";
import { LinkButton } from "~/components/Button";
import { Tab } from "~/components/Tab";
import { styled, Box, Flex, Spacer } from "~/styled-system/jsx";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.date) {
    const today = new Date();
    return redirect(`/calendar/day/${format(today, "dd-MM-yy")}`);
  }

  return null;
};

const CalendarPage = () => {
  const location = useLocation();

  return (
    <Box maxW={800} mx="auto" px={2}>
      <Box py={8}>
        <styled.img src="/rcdriftuk.svg" w={180} mx="auto" />
      </Box>
      <Flex p={1} bgColor="gray.800" rounded="lg" gap={2} mb={2}>
        <Tab
          isActive={location.pathname.includes("/calendar/day")}
          to="/calendar/day"
        >
          Day
        </Tab>
        <Tab
          isActive={location.pathname.includes("/calendar/week")}
          to="/calendar/week"
        >
          Week
        </Tab>
        <Tab
          isActive={location.pathname.includes("/calendar/month")}
          to="/calendar/month"
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
