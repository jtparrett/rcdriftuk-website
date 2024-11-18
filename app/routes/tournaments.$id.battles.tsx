import { BattlesBracket } from "@prisma/client";
import { Fragment } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { Box, Divider, Flex, styled } from "~/styled-system/jsx";
import { getBracketName } from "~/utils/getBracketName";
import { prisma } from "~/utils/prisma.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = z.string().parse(params.id);

  const tournament = await prisma.tournaments.findFirstOrThrow({
    where: {
      id,
    },
    include: {
      drivers: {
        select: {
          name: true,
        },
      },
      battles: {
        where: {
          bracket: BattlesBracket.UPPER,
        },
        orderBy: [
          {
            round: "asc",
          },
          { bracket: "asc" },
          { id: "asc" },
        ],
        include: {
          driverLeft: true,
          driverRight: true,
        },
      },
    },
  });

  return tournament;
};

type Battle = Awaited<ReturnType<typeof loader>>["battles"][number];

const Spacer = () => <Box my={-6} flex={1} />;

const Driver = ({
  driver,
  isWinner,
}: {
  driver: Battle["driverLeft"] | Battle["driverRight"];
  isWinner: boolean;
}) => {
  return (
    <Flex alignItems="center" py={0.5} h={6}>
      <styled.span
        flex="none"
        w={6}
        textAlign="center"
        fontSize="xs"
        fontWeight="semibold"
        color="gray.500"
      >
        {driver?.qualifyingPosition}
      </styled.span>
      <styled.p
        fontWeight="semibold"
        fontSize="xs"
        whiteSpace="nowrap"
        textOverflow="ellipsis"
        overflow="hidden"
        color={isWinner ? "green.400" : undefined}
        pr={2}
      >
        {driver?.name ?? ""}
      </styled.p>
    </Flex>
  );
};

const TournamentBattlesPage = () => {
  const tournament = useLoaderData<typeof loader>();

  const battlesByRound = tournament.battles.reduce<Record<string, Battle[]>>(
    (agg, battle) => {
      return {
        ...agg,
        [battle.round]: [...(agg[battle.round?.toString()] ?? []), battle],
      };
    },
    {}
  );

  const battlesInRound = Object.values(battlesByRound).reduce<Battle[][]>(
    (agg, round) => {
      const n = Math.log2(round.length);
      const isOddRound = n - Math.floor(n) !== 0;

      const battlesInFirstChunk = Math.floor(round.length / 1.5);
      const firstChunk = isOddRound
        ? round.slice(0, battlesInFirstChunk)
        : round;

      const secondChunk = isOddRound
        ? round.slice(battlesInFirstChunk, round.length)
        : [];

      return [...agg, firstChunk, secondChunk].filter(
        (item) => item.length > 0
      );
    },
    []
  );

  return (
    <Box
      p={1}
      rounded="3xl"
      bg="gray.900"
      borderWidth={1}
      borderColor="gray.700"
    >
      <Box
        overflow="auto"
        p={8}
        borderWidth={1}
        borderColor="gray.700"
        rounded="2xl"
        bg="black"
      >
        <Flex>
          {battlesInRound.map((battles, i) => {
            return (
              <Box key={i} w={240} flex="none">
                <styled.p
                  fontSize="sm"
                  textAlign="center"
                  textTransform="uppercase"
                  fontWeight="bold"
                >
                  {getBracketName(battles[0].round, battles[0].bracket)}
                </styled.p>
                <Flex
                  flexDir="column"
                  style={{
                    height:
                      Math.ceil(tournament.drivers.length / 2) * 54 + "px",
                  }}
                >
                  <Spacer />
                  {battles.map((battle, i) => {
                    const isNextBattle = tournament.nextBattleId === battle?.id;
                    return (
                      <Fragment key={battle.id}>
                        <Box position="relative" flex="none">
                          <Divider
                            position="absolute"
                            borderBottomWidth={1}
                            top="50%"
                            w="full"
                            zIndex={1}
                            borderBottomColor="gray.400"
                          />
                          <Box
                            mx={4}
                            rounded="lg"
                            borderWidth={1}
                            borderColor={
                              isNextBattle ? "brand.500" : "gray.400"
                            }
                            position="relative"
                            zIndex={2}
                            overflow="hidden"
                          >
                            <Driver
                              driver={battle.driverLeft}
                              isWinner={battle.winnerId === battle.driverLeftId}
                            />
                            <Driver
                              driver={battle.driverRight}
                              isWinner={
                                battle.winnerId === battle.driverRightId
                              }
                            />
                          </Box>
                        </Box>

                        {i % 2 === 0 && battles.length > 1 ? (
                          <Box
                            borderRightWidth={1}
                            borderRightColor="gray.400"
                            flex={1}
                            my={-6}
                          />
                        ) : (
                          <Spacer />
                        )}
                      </Fragment>
                    );
                  })}
                </Flex>
              </Box>
            );
          })}
        </Flex>
      </Box>
    </Box>
  );
};

export default TournamentBattlesPage;
