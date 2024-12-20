import { BattlesBracket, TournamentsState } from "@prisma/client";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import {
  Form,
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import { useState } from "react";
import { Popover } from "react-tiny-popover";
import invariant from "tiny-invariant";
import { z } from "zod";
import { Button, LinkButton } from "~/components/Button";
import { QRCode } from "~/components/QRCode";
import { Select } from "~/components/Select";
import { TournamentStartForm } from "~/components/TournamentStartForm";
import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import type { GetTournament } from "~/utils/getTournament.server";
import { getTournament } from "~/utils/getTournament.server";
import { prisma } from "~/utils/prisma.server";
import { tournamentEndQualifying } from "~/utils/tournamentEndQualifying";
import { tournamentNextBattle } from "~/utils/tournamentNextBattle";
import { useDisclosure } from "~/utils/useDisclosure";
import { useReloader } from "~/utils/useReloader";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  invariant(userId);

  const tournament = await getTournament(id, userId);

  if (!tournament) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  return tournament;
};

export const action = async ({ params }: ActionFunctionArgs) => {
  const id = z.string().parse(params.id);

  const tournament = await prisma.tournaments.findFirstOrThrow({
    where: {
      id,
    },
    include: {
      judges: true,
      nextQualifyingLap: {
        include: {
          scores: true,
        },
      },
    },
  });

  if (
    tournament.state === TournamentsState.QUALIFYING &&
    tournament.nextQualifyingLapId === null
  ) {
    await tournamentEndQualifying(id);
    return redirect(`/tournaments/${id}/qualifying`);
  }

  if (tournament.state === TournamentsState.QUALIFYING) {
    invariant(
      tournament?.judges.length ===
        tournament?.nextQualifyingLap?.scores.length,
      "Judging not complete for current lap"
    );

    const nextQualifyingLap = await prisma.laps.findFirst({
      where: {
        driver: {
          tournamentId: id,
        },
        scores: {
          none: {},
        },
      },
      orderBy: [
        {
          tournamentDriverId: "asc",
        },
        { id: "asc" },
      ],
    });

    await prisma.tournaments.update({
      where: {
        id,
      },
      data: {
        nextQualifyingLapId: nextQualifyingLap?.id ?? null,
      },
    });
  }

  if (tournament.state === TournamentsState.BATTLES) {
    await tournamentNextBattle(id);
    const nextBattle = await prisma.tournaments.findFirst({
      where: {
        id,
      },
      select: {
        nextBattle: {
          select: {
            bracket: true,
          },
        },
      },
    });

    return redirect(
      `/tournaments/${id}/battles/${nextBattle?.nextBattle?.bracket ?? BattlesBracket.UPPER}`
    );
  }

  return redirect(`/tournaments/${id}/qualifying`);
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: `RC Drift UK | ${data?.name}` }];
};

const JudgingMenuButton = ({ tournament }: { tournament: GetTournament }) => {
  const { isOpen, toggle, onClose } = useDisclosure();
  const [selectedJudge, setSelectedJudge] = useState(tournament?.judges[0].id);

  useReloader();

  return (
    <Popover
      isOpen={isOpen}
      positions={["bottom"]}
      onClickOutside={onClose}
      containerStyle={{
        zIndex: "1000",
      }}
      content={
        <Box p={4} bgColor="brand.500" maxW={200} rounded="md" m={2}>
          <styled.p fontSize="sm" fontWeight="semibold" mb={2}>
            Scan the QR code to access the judges remote:
          </styled.p>

          <Select
            mb={2}
            onChange={(e) => setSelectedJudge(e.target.value)}
            value={selectedJudge}
          >
            {tournament?.judges.map((judge) => {
              return (
                <option key={judge.id} value={judge.id}>
                  {judge.name}
                </option>
              );
            })}
          </Select>

          <QRCode
            value={`https://rcdrift.uk/judge/${selectedJudge}`}
            width={165}
          />

          <Link to={`/judge/${selectedJudge}`} target="_blank">
            Or Click Here
          </Link>
        </Box>
      }
    >
      <Button
        variant="secondary"
        size="xs"
        whiteSpace="nowrap"
        onClick={() => {
          toggle();
        }}
      >
        Open Judging Remote
      </Button>
    </Popover>
  );
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
            flexGrow={1}
            w={{ base: "full", sm: "auto" }}
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {tournament.name}
          </styled.h1>

          {tournament.state !== TournamentsState.START && (
            <JudgingMenuButton tournament={tournament} />
          )}
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
                to={`/tournaments/${tournament.id}/battles/${BattlesBracket.UPPER}`}
                variant={isBattlesTab ? "secondary" : "ghost"}
                size="xs"
              >
                Battles
              </LinkButton>
            </Flex>

            <Spacer />

            {tournament.state === TournamentsState.QUALIFYING &&
              tournament.nextQualifyingLap &&
              tournament.nextQualifyingLap.scores.length ===
                tournament.judges.length &&
              tournament.nextQualifyingLap && (
                <Form method="post">
                  <Button type="submit">Start Next Run</Button>
                </Form>
              )}

            {tournament.state === TournamentsState.QUALIFYING &&
              tournament.nextQualifyingLap === null && (
                <Form method="post">
                  <Button type="submit">End Qualifying</Button>
                </Form>
              )}

            {tournament.state === TournamentsState.BATTLES &&
              (tournament.nextBattle?.BattleVotes.length ?? 0) >=
                tournament.judges.length && (
                <Form method="post">
                  <Button type="submit">Start Next Battle</Button>
                </Form>
              )}
          </Flex>

          <Outlet />
        </>
      )}
    </Container>
  );
};

export default TournamentPage;
