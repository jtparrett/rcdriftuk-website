import { TournamentsState } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { capitalCase } from "change-case";
import invariant from "tiny-invariant";
import { z } from "zod";
import { Button } from "~/components/Button";
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

  return (
    <Container pb={12} px={2} pt={8} maxW={1100}>
      <Box mb={2}>
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
        <styled.h1 fontSize="4xl" fontWeight="extrabold">
          {tournament.event.name}
        </styled.h1>
      </Box>

      {tournament.state === TournamentsState.START && (
        <TournamentStartForm tournament={tournament} />
      )}

      {tournament.state === TournamentsState.QUALIFYING && (
        <>
          <Flex
            bgColor="gray.900"
            rounded="xl"
            gap={1}
            p={1}
            display="inline-flex"
            mb={4}
          >
            <Button size="xs" variant="secondary">
              Info
            </Button>
            <Button variant="ghost" size="xs">
              Qualifying
            </Button>
            <Button variant="ghost" size="xs">
              Battles
            </Button>
          </Flex>

          <Box>
            <styled.h2>Next Qualifying</styled.h2>
            <styled.p>{tournament.nextQualifyingLap?.driver.name}</styled.p>
          </Box>
        </>
      )}
    </Container>
  );
};

export default TournamentPage;
