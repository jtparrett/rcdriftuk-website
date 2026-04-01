import { z } from "zod";
import type { LoaderFunctionArgs } from "react-router";
import {
  Outlet,
  useLoaderData,
  useLocation,
  useSearchParams,
} from "react-router";
import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { Button, LinkButton } from "~/components/Button";
import { Tab } from "~/components/Tab";
import { prisma } from "~/utils/prisma.server";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import {
  RiEditCircleFill,
  RiFullscreenFill,
  RiListOrdered2,
  RiShareForwardFill,
  RiVipCrown2Line,
} from "react-icons/ri";
import { TabsBar } from "~/components/TabsBar";
import { useIsEmbed } from "~/utils/EmbedContext";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  const leaderboard = await prisma.leaderboards.findUnique({
    where: { id },
    select: { id: true, name: true, userId: true },
  });

  notFoundInvariant(leaderboard, "Leaderboard not found");

  return {
    leaderboard,
    isOwner: leaderboard.userId === userId,
  };
};

const LeaderboardLayout = () => {
  const { leaderboard, isOwner } = useLoaderData<typeof loader>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isEmbed = useIsEmbed();

  const isStandingsTab =
    location.pathname.endsWith("/standings") ||
    location.pathname === `/leaderboards/${leaderboard.id}`;
  const isTournamentsTab = location.pathname.endsWith("/tournaments");

  const queryString = searchParams.toString();
  const search = queryString ? `?${queryString}` : "";

  return (
    <>
      <TabsBar maxW={800}>
        <Tab
          to={`/leaderboards/${leaderboard.id}/standings${search}`}
          isActive={isStandingsTab}
          replace
        >
          <RiListOrdered2 />
          Standings
        </Tab>
        <Tab
          to={`/leaderboards/${leaderboard.id}/tournaments${search}`}
          isActive={isTournamentsTab}
          replace
        >
          <RiVipCrown2Line />
          Tournaments
        </Tab>

        <Spacer />

        {isOwner && (
          <LinkButton
            to={`/leaderboards/${leaderboard.id}/edit`}
            variant="secondary"
            py={1.5}
          >
            Edit <RiEditCircleFill />
          </LinkButton>
        )}
        <Button
          px={2}
          variant="secondary"
          onClick={() => {
            navigator.share({
              url: `https://rcdrift.io/leaderboards/${leaderboard.id}`,
            });
          }}
        >
          <RiShareForwardFill />
        </Button>
        <LinkButton
          to={`${location.pathname}?${new URLSearchParams([...Array.from(searchParams).filter(([k]) => k !== "embed"), ["embed", "true"]]).toString()}`}
          px={2}
          target="_blank"
          variant="secondary"
        >
          <RiFullscreenFill />
        </LinkButton>
      </TabsBar>

      <Container maxW={800} px={2} py={4}>
        <styled.h1
          fontSize="lg"
          fontWeight="semibold"
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
          mb={4}
        >
          {leaderboard.name}
        </styled.h1>

        <Outlet />
      </Container>
    </>
  );
};

export default LeaderboardLayout;
