import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { Outlet, useLocation, useParams } from "react-router";
import {
  add,
  endOfWeek,
  format,
  isThisWeek,
  parse,
  startOfWeek,
  sub,
} from "date-fns";
import { Tab } from "~/components/Tab";
import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import type { Route } from "./+types/calendar.$region";
import { TabsBar } from "~/components/TabsBar";
import { AppName, Regions } from "~/utils/enums";
import { z } from "zod";
import { LinkButton } from "~/components/Button";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";

export const meta: Route.MetaFunction = ({ params }) => {
  const today = format(new Date(), "dd-MM-yy");
  const dateParam = params.date ?? today;
  const date = parse(dateParam, "dd-MM-yy", new Date());
  const thisWeek = isThisWeek(date, {
    weekStartsOn: 1,
  });

  return [
    { title: `${AppName} | Calendar` },
    {
      name: "description",
      content:
        "All of the RC Drifting events from across the world in one calendar.",
    },
    {
      property: "og:image",
      content: thisWeek
        ? "https://rcdrift.io/thisweek-og-image.png"
        : "https://rcdrift.io/og-image.jpg",
    },
  ];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const url = new URL(request.url);
  const region = z.nativeEnum(Regions).safeParse(params.region?.toUpperCase());

  if (
    url.pathname === "/calendar" ||
    url.pathname === "/calendar/" ||
    !args.params.date
  ) {
    const today = format(new Date(), "dd-MM-yy");
    throw redirect(`/calendar/${params.region}/week/${today}`);
  }

  const date = parse(args.params.date, "dd-MM-yy", new Date());

  return { date, region: region.data };
};

const CalendarPage = () => {
  const { date, region } = useLoaderData<typeof loader>();
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
      return format(date, "EEEE, do MMMM, yyyy");
    }

    if (increment === "week") {
      return `${format(startWeekDate, "do")} / ${format(endWeekDate, "do MMMM, yyyy")}`;
    }

    if (increment === "month") {
      return format(date, "MMMM, yyyy");
    }
  };

  const nextDate = () => {
    if (increment === "day") {
      return format(add(date, { days: 1 }), "dd-MM-yy");
    }

    if (increment === "week") {
      return format(add(date, { weeks: 1 }), "dd-MM-yy");
    }

    if (increment === "month") {
      return format(add(date, { months: 1 }), "dd-MM-yy");
    }
  };

  const previousDate = () => {
    if (increment === "day") {
      return format(sub(date, { days: 1 }), "dd-MM-yy");
    }

    if (increment === "week") {
      return format(sub(date, { weeks: 1 }), "dd-MM-yy");
    }

    if (increment === "month") {
      return format(sub(date, { months: 1 }), "dd-MM-yy");
    }
  };

  return (
    <>
      <TabsBar>
        {Object.values(Regions).map((option) => {
          return (
            <Tab
              key={option}
              to={`/calendar/${option.toLowerCase()}/${increment}/${dateParam}`}
              isActive={option === region}
              data-replace="true"
              replace
            >
              {option}
            </Tab>
          );
        })}
      </TabsBar>

      <Box borderBottomWidth={1} borderColor="gray.900">
        <Container px={2} maxW={1100}>
          <Flex gap={0.5} py={2} alignItems="center">
            <Tab
              isActive={location.pathname.includes(
                `/calendar/${params.region}/day`,
              )}
              to={`/calendar/${params.region}/day/${dateParam}`}
              data-replace="true"
              replace
            >
              Day
            </Tab>
            <Tab
              isActive={location.pathname.includes(
                `/calendar/${params.region}/week`,
              )}
              to={`/calendar/${params.region}/week/${dateParam}`}
              data-replace="true"
              replace
            >
              Week
            </Tab>
            <Tab
              isActive={location.pathname.includes(
                `/calendar/${params.region}/month`,
              )}
              to={`/calendar/${params.region}/month/${dateParam}`}
              data-replace="true"
              replace
            >
              Month
            </Tab>

            <Spacer />

            <LinkButton
              size="sm"
              variant="outline"
              to={`/calendar/${region}/${increment}/${previousDate()}`}
              data-replace="true"
              replace
              h={10}
            >
              <RiArrowLeftSLine />
            </LinkButton>
            <LinkButton
              size="sm"
              variant="outline"
              to={`/calendar/${region}/${increment}/${today}`}
              h={10}
              data-replace="true"
              replace
            >
              Today
            </LinkButton>
            <LinkButton
              size="sm"
              variant="outline"
              to={`/calendar/${region}/${increment}/${nextDate()}`}
              h={10}
              data-replace="true"
              replace
            >
              <RiArrowRightSLine />
            </LinkButton>
          </Flex>
        </Container>
      </Box>

      <Container px={2} maxW={1100} py={2}>
        <Box
          mx="auto"
          bgColor="gray.900"
          rounded="full"
          py={2}
          px={4}
          borderWidth={1}
          borderColor="gray.800"
          w="fit-content"
          textAlign="center"
        >
          <styled.p fontWeight="semibold">{getDate()}</styled.p>
        </Box>

        <Outlet />
      </Container>
    </>
  );
};

export default CalendarPage;
