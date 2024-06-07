import { TournamentsFormat, TournamentsState } from "@prisma/client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { capitalCase } from "change-case";
import invariant from "tiny-invariant";
import { z } from "zod";
import { Button } from "~/components/Button";
import { TournamentStartForm } from "~/components/TournamentStartForm";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getTournament } from "~/utils/getTournament.server";
import { nameStringToArray } from "~/utils/nameStringToArray";
import { prisma } from "~/utils/prisma.server";

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

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);
  const id = z.string().parse(args.params.id);

  invariant(userId);

  const tournament = await prisma.tournaments.findFirst({
    where: {
      state: TournamentsState.START,
      event: {
        eventTrack: {
          owners: {
            some: {
              id: userId,
            },
          },
        },
      },
    },
  });

  invariant(tournament);

  const formData = await args.request.formData();
  const drivers = z.string().parse(formData.get("drivers"));
  const judges = z.string().parse(formData.get("judges"));
  const qualifyingLaps = Math.max(
    z.coerce.number().parse(formData.get("qualifyingLaps")),
    1
  );
  const format = z.nativeEnum(TournamentsFormat).parse(formData.get("format"));

  await prisma.$transaction([
    prisma.tournamentDrivers.createMany({
      data: nameStringToArray(drivers).map((name) => {
        return {
          name,
          tournamentId: id,
        };
      }),
    }),

    prisma.tournamentJudges.createMany({
      data: nameStringToArray(judges).map((name) => {
        return {
          name,
          tournamentId: id,
        };
      }),
    }),

    prisma.tournaments.update({
      where: {
        id,
      },
      data: {
        state: TournamentsState.QUALIFYING,
        qualifyingLaps,
        format,
      },
    }),
  ]);

  return null;
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

          <Box maxW={500} bgColor="gray.900" p={6} rounded="xl">
            <styled.table w="full">
              <styled.tbody>
                {tournament.drivers.map((driver, i) => {
                  return (
                    <styled.tr key={driver.id}>
                      <styled.td>{i + 1}</styled.td>
                      <styled.td>{driver.name}</styled.td>
                    </styled.tr>
                  );
                })}
              </styled.tbody>
            </styled.table>
          </Box>
        </>
      )}
    </Container>
  );
};

export default TournamentPage;
