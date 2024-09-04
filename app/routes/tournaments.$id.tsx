import { TournamentsState } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { capitalCase } from "change-case";
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
import { useDisclosure } from "~/utils/useDisclosure";

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

const JudgingPortalButton = ({ tournament }: { tournament: GetTournament }) => {
  const { isOpen, toggle, onClose } = useDisclosure();
  const [selectedJudge, setSelectedJudge] = useState(tournament?.judges[0].id);

  return (
    <Popover
      isOpen={isOpen}
      positions={["bottom"]}
      onClickOutside={onClose}
      content={
        <Box p={4} bgColor="brand.500" maxW={200} rounded="md" m={2}>
          <styled.p fontSize="sm" fontWeight="semibold" mb={2}>
            Scan the QR code to access the judging portal:
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
        Open Judging Portal
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
            lineHeight={1}
            flexGrow={1}
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

          <JudgingPortalButton tournament={tournament} />
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
