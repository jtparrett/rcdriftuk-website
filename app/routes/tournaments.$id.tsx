import { TournamentsState } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { capitalCase } from "change-case";
import invariant from "tiny-invariant";
import { z } from "zod";
import { LinkButton } from "~/components/Button";
import { TournamentStartForm } from "~/components/TournamentStartForm";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
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
  const isStatusTab = location.pathname.includes("status");
  const isQualifyingTab = location.pathname.includes("qualifying");
  const isBattlesTab = location.pathname.includes("battles");

  return (
    <Container pb={12} px={2} pt={8} maxW={1100}>
      <Box mb={4}>
        <styled.p
          rounded="md"
          bgColor="green.300"
          color="green.600"
          fontWeight="semibold"
          fontSize="sm"
          display="inline-block"
          px={2}
          mb={2}
        >
          {capitalCase(tournament.state)}
        </styled.p>
        <styled.h1 fontSize="4xl" fontWeight="extrabold" lineHeight={1.2}>
          {tournament.event.name}
        </styled.h1>
      </Box>

      {tournament.state === TournamentsState.START && (
        <TournamentStartForm tournament={tournament} />
      )}

      {tournament.state !== TournamentsState.START && (
        <>
          <Box mb={4}>
            <Flex
              bgColor="gray.900"
              rounded="xl"
              gap={1}
              p={1}
              display="inline-flex"
            >
              <LinkButton
                to={`/tournaments/${tournament.id}/status`}
                size="xs"
                variant={isStatusTab ? "secondary" : "ghost"}
              >
                Status
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
          </Box>

          <Outlet />
        </>
      )}
    </Container>
  );
};

export default TournamentPage;
