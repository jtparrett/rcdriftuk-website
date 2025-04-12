import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import {
  Outlet,
  useLocation,
  useParams,
  useLoaderData,
} from "@remix-run/react";
import { format, isThisWeek, parse } from "date-fns";
import { RiAddCircleFill } from "react-icons/ri";
import { LinkButton } from "~/components/Button";
import { Tab } from "~/components/Tab";
import { Flex, Spacer, Container, Box } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";

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

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const url = new URL(request.url);
  const { userId } = await getAuth(args);

  if (url.pathname === "/calendar" || url.pathname === "/calendar/") {
    const today = format(new Date(), "dd-MM-yy");
    return redirect(`/calendar/week/${today}`);
  }

  if (userId) {
    const userData = await prisma.users.findFirst({
      where: {
        id: userId,
      },
    });

    return userData;
  }

  return null;
};

const CalendarPage = () => {
  const location = useLocation();
  const params = useParams();
  const today = format(new Date(), "dd-MM-yy");
  const dateParam = params.date ?? today;
  const userData = useLoaderData<typeof loader>();

  return (
    <>
      <Box mb={2} py={2} borderBottomWidth={1} borderColor="gray.900">
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

            {userData && userData.trackId && (
              <LinkButton size="sm" to="/calendar/new">
                Create Event <RiAddCircleFill />
              </LinkButton>
            )}
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
