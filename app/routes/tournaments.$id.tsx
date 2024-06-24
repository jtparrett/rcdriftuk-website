import { TournamentsState } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { capitalCase } from "change-case";
import invariant from "tiny-invariant";
import { z } from "zod";
import { Button, LinkButton } from "~/components/Button";
import { TournamentStartForm } from "~/components/TournamentStartForm";
import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getTournament } from "~/utils/getTournament.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  invariant(userId);

  const tournament = await getTournament(id);

  if (!tournament) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  return tournament;
};

const TournamentPage = () => {
  const tournament = useLoaderData<typeof loader>();
  const location = useLocation();
  const isOverviewTab = location.pathname.includes("overview");
  const isQualifyingTab = location.pathname.includes("qualifying");
  const isBattlesTab = location.pathname.includes("battles");

  return (
    <Container pb={12} px={2} pt={8} maxW={1100}>
      <Box mb={4}>
        <Flex
          alignItems="center"
          px={4}
          py={2}
          rounded="xl"
          bgColor="gray.900"
          gap={2}
          flexWrap={{ base: "wrap", sm: "nowrap" }}
        >
          <styled.h1
            fontSize="2xl"
            fontWeight="extrabold"
            lineHeight={1}
            maxW={{ sm: 300 }}
            w={{ base: "full", sm: "auto" }}
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {tournament.event.name}
          </styled.h1>
          <styled.p
            rounded="md"
            bgColor="green.300"
            color="green.600"
            fontWeight="semibold"
            fontSize="sm"
            display="inline-block"
            px={2}
          >
            {capitalCase(tournament.state)}
          </styled.p>

          <Spacer />

          <Button variant="secondary" size="xs" whiteSpace="nowrap">
            Open Judging Portal
          </Button>
        </Flex>
      </Box>

      {tournament.state === TournamentsState.START && (
        <TournamentStartForm tournament={tournament} />
      )}

      {tournament.state !== TournamentsState.START && (
        <>
          <Flex
            mb={4}
            alignItems={{ sm: "center" }}
            flexDir={{ base: "column-reverse", sm: "row" }}
            gap={2}
          >
            <Flex
              bgColor="gray.900"
              rounded="xl"
              gap={1}
              p={1}
              display="inline-flex"
            >
              <LinkButton
                to={`/tournaments/${tournament.id}/overview`}
                size="xs"
                variant={isOverviewTab ? "secondary" : "ghost"}
              >
                Overview
              </LinkButton>
              <LinkButton
                to={`/tournaments/${tournament.id}/qualifying`}
                variant={isQualifyingTab ? "secondary" : "ghost"}
                size="xs"
              >
                Qualifying
              </LinkButton>
              <LinkButton
                to={`/tournaments/${tournament.id}/battles`}
                variant={isBattlesTab ? "secondary" : "ghost"}
                size="xs"
              >
                Battles
              </LinkButton>
            </Flex>

            <Spacer />

            {tournament.state === TournamentsState.QUALIFYING && (
              <Button>Start Next Lap</Button>
            )}
          </Flex>

          <Outlet />
        </>
      )}
    </Container>
  );
};

export default TournamentPage;
