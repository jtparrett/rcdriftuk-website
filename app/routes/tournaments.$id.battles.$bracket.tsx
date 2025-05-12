import { BattlesBracket, TournamentsFormat } from "@prisma/client";
import { Fragment } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { getBracketName } from "~/utils/getBracketName";
import { prisma } from "~/utils/prisma.server";
import { Glow } from "~/components/Glow";
import { LinkButton } from "~/components/Button";
import { sentenceCase } from "change-case";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = z.string().parse(params.id);
  const bracket = z
    .nativeEnum(BattlesBracket)
    .parse(params.bracket?.toUpperCase());

  const tournament = await prisma.tournaments.findFirstOrThrow({
    where: {
      id,
    },
    include: {
      drivers: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      battles: {
        where: {
          bracket: bracket,
        },
        orderBy: [
          {
            round: "asc",
          },
          { bracket: "asc" },
          { id: "asc" },
        ],
        include: {
          driverLeft: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          driverRight: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return {
    tournament,
    bracket,
  };
};

type Battle = Awaited<
  ReturnType<typeof loader>
>["tournament"]["battles"][number];

const Spacer = () => <Box my={-6} flex={1} />;

const Driver = ({
  driver,
  winnerId,
}: {
  driver: Battle["driverLeft"] | Battle["driverRight"];
  winnerId: number | null;
}) => {
  if (driver?.isBye) {
    return (
      <Flex h={6} alignItems="center" pl={6}>
        <styled.span
          fontSize="xs"
          display="block"
          color="gray.800"
          fontWeight="semibold"
        >
          Bye Run
        </styled.span>
      </Flex>
    );
  }

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
        color={
          winnerId === null
            ? undefined
            : winnerId === driver?.id
              ? "green.500"
              : "gray.500"
        }
        pr={2}
      >
        {driver?.user.firstName} {driver?.user.lastName}
      </styled.p>
    </Flex>
  );
};

const TournamentBattlesPage = () => {
  const { tournament, bracket } = useLoaderData<typeof loader>();

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
    <>
      {tournament.format === TournamentsFormat.DOUBLE_ELIMINATION && (
        <Flex
          bgColor="gray.900"
          rounded="xl"
          gap={1}
          p={1}
          display="inline-flex"
          mb={4}
        >
          {Object.values(BattlesBracket).map((sub) => {
            return (
              <LinkButton
                key={sub}
                to={`/tournaments/${tournament.id}/battles/${sub}`}
                size="xs"
                variant={sub === bracket ? "secondary" : "ghost"}
              >
                {sentenceCase(sub)} Bracket
              </LinkButton>
            );
          })}
        </Flex>
      )}

      <Box
        p={1}
        rounded="3xl"
        bg="gray.900"
        borderWidth={1}
        borderColor="gray.800"
      >
        <Box
          overflow="auto"
          p={8}
          borderWidth={1}
          borderColor="gray.800"
          rounded="2xl"
          bg="black"
        >
          {tournament.battles.length <= 0 && (
            <styled.p>No battles here.</styled.p>
          )}

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
                    {getBracketName(
                      battles[0].round,
                      battles[0].bracket,
                      tournament.format
                    )}
                  </styled.p>
                  <Flex
                    flexDir="column"
                    style={{
                      height: Math.ceil(battlesByRound[1].length) * 54 + "px",
                    }}
                  >
                    <Spacer />
                    {battles.map((battle, i) => {
                      const isNextBattle =
                        tournament.nextBattleId === battle?.id;
                      return (
                        <Fragment key={battle.id}>
                          <Box position="relative" flex="none" zIndex={1}>
                            {battles.length <= 1 && (
                              <Box
                                pos="absolute"
                                top="50%"
                                borderBottomWidth={1}
                                borderColor="gray.700"
                                w="full"
                                borderStyle="dashed"
                              />
                            )}
                            <Box
                              mx={4}
                              h={12}
                              rounded="lg"
                              borderWidth={1}
                              borderColor={
                                isNextBattle ? "brand.500" : "gray.700"
                              }
                              position="relative"
                              overflow="hidden"
                            >
                              {isNextBattle && <Glow size="sm" />}
                              <Driver
                                driver={battle.driverLeft}
                                winnerId={battle.winnerId}
                              />
                              <Driver
                                driver={battle.driverRight}
                                winnerId={battle.winnerId}
                              />
                            </Box>
                          </Box>

                          {i % 2 === 0 && battles.length > 1 ? (
                            <Box
                              borderRightWidth={1}
                              borderTopWidth={1}
                              borderBottomWidth={1}
                              borderStyle="dashed"
                              borderColor="gray.700"
                              flex={1}
                              my={-6}
                              borderRightRadius="lg"
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
    </>
  );
};

export default TournamentBattlesPage;
