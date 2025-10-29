import {
  BattlesBracket,
  TournamentsDriverNumbers,
  TournamentsFormat,
} from "~/utils/enums";
import { Fragment } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import { z } from "zod";
import { Box, Center, Flex, styled } from "~/styled-system/jsx";
import { getBracketName } from "~/utils/getBracketName";
import { prisma } from "~/utils/prisma.server";
import { Glow } from "~/components/Glow";
import { sentenceCase } from "change-case";
import { HiddenEmbed, useIsEmbed } from "~/utils/EmbedContext";
import { Tab, TabGroup } from "~/components/Tab";

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
                  driverId: true,
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
                  driverId: true,
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
  driverNo,
}: {
  driver: Battle["driverLeft"] | Battle["driverRight"];
  winnerId: number | null;
  driverNo: number | undefined;
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
    <Flex alignItems="center" py={0.5} h={6} px="1px">
      {driver?.qualifyingPosition !== null &&
        driver?.qualifyingPosition !== undefined && (
          <Center
            w={5}
            h={5}
            flex="none"
            bgGradient="to-b"
            gradientFrom="brand.500"
            gradientTo="brand.700"
            rounded="md"
            mb="1px"
          >
            <styled.span fontSize="xs" fontWeight="medium">
              {driver.qualifyingPosition}
            </styled.span>
          </Center>
        )}
      <styled.p
        fontWeight="semibold"
        fontSize="xs"
        whiteSpace="nowrap"
        textOverflow="ellipsis"
        overflow="hidden"
        ml={2}
        color={
          winnerId === null
            ? undefined
            : winnerId === driver?.id
              ? "green.500"
              : "gray.500"
        }
        pr={2}
      >
        <Link to={`/drivers/${driver?.user.driverId}`}>
          {driver?.user.firstName} {driver?.user.lastName}{" "}
          {driverNo !== undefined && (
            <styled.span color="gray.600">({driverNo})</styled.span>
          )}
        </Link>
      </styled.p>
    </Flex>
  );
};

const TournamentBattlesPage = () => {
  const { tournament, bracket } = useLoaderData<typeof loader>();
  const isEmbed = useIsEmbed();

  const getDriverNumber = (
    driver: Battle["driverLeft"] | Battle["driverRight"],
  ) => {
    if (tournament.driverNumbers === TournamentsDriverNumbers.NONE) {
      return undefined;
    }
    if (tournament.driverNumbers === TournamentsDriverNumbers.UNIVERSAL) {
      return driver?.user.driverId;
    }
    return driver?.tournamentDriverNumber;
  };

  const battlesByRound = tournament.battles.reduce<Record<string, Battle[]>>(
    (agg, battle) => {
      return {
        ...agg,
        [battle.round]: [...(agg[battle.round?.toString()] ?? []), battle],
      };
    },
    {},
  );

  const battlesInRound = Object.values(battlesByRound).reduce<Battle[][]>(
    (agg, battles) => {
      if (tournament.format === TournamentsFormat.EXHIBITION) {
        return [battles];
      }

      const n = Math.log2(battles.length);
      const isOddRound = n - Math.floor(n) !== 0;

      const battlesInFirstChunk = Math.floor(battles.length / 1.5);
      const firstChunk = isOddRound
        ? battles.slice(0, battlesInFirstChunk)
        : battles;

      const secondChunk = isOddRound
        ? battles.slice(battlesInFirstChunk, battles.length)
        : [];

      return [...agg, firstChunk, secondChunk].filter(
        (item) => item.length > 0,
      );
    },
    [],
  );

  return (
    <>
      <HiddenEmbed>
        {(tournament.format === TournamentsFormat.DOUBLE_ELIMINATION ||
          tournament.format === TournamentsFormat.WILDCARD) && (
          <TabGroup mb={4}>
            {Object.values(BattlesBracket).map((sub) => {
              return (
                <Tab
                  key={sub}
                  to={`/tournaments/${tournament.id}/battles/${sub}`}
                  isActive={sub === bracket}
                  replace
                >
                  {sentenceCase(sub)} Bracket
                </Tab>
              );
            })}
          </TabGroup>
        )}
      </HiddenEmbed>

      <Box
        p={isEmbed ? 0 : 1}
        rounded="3xl"
        bg="gray.900"
        borderWidth={isEmbed ? 0 : 1}
        borderColor="gray.800"
        className="bg"
      >
        <Flex
          overflow="auto"
          scrollbar="hidden"
          py={8}
          borderWidth={isEmbed ? 0 : 1}
          borderColor="gray.800"
          rounded="2xl"
          className="main"
          bg="black"
          bgImage={isEmbed ? undefined : "url(/dot-bg.svg)"}
          bgRepeat="repeat"
          bgSize="16px"
          bgPosition="center"
          justifyContent={
            tournament.format === TournamentsFormat.EXHIBITION
              ? "center"
              : undefined
          }
        >
          {tournament.battles.length <= 0 && (
            <styled.p textAlign="center" w="full">
              No battles constructed yet.
            </styled.p>
          )}

          {battlesInRound.map((battles, i) => {
            return (
              <Box key={i} w={240} flex="none">
                {tournament.format !== TournamentsFormat.EXHIBITION && (
                  <styled.p
                    fontSize="sm"
                    textAlign="center"
                    textTransform="uppercase"
                    fontWeight="bold"
                  >
                    {getBracketName(
                      battles[0].round,
                      battles[0].bracket,
                      battles.length,
                    )}
                  </styled.p>
                )}

                <Flex
                  flexDir="column"
                  style={{
                    height:
                      Math.ceil(battlesInRound[0]?.length ?? 0) * 54 + "px",
                  }}
                >
                  <Spacer />
                  {battles.map((battle, i) => {
                    const isNextBattle = tournament.nextBattleId === battle?.id;
                    return (
                      <Fragment key={battle.id}>
                        <Box position="relative" flex="none" zIndex={1}>
                          {(battles.length <= 1 ||
                            tournament.format ===
                              TournamentsFormat.EXHIBITION) && (
                            <Box
                              pos="absolute"
                              top="50%"
                              borderBottomWidth={1}
                              borderColor="gray.700"
                              w="full"
                              borderStyle="dashed"
                              zIndex={1}
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
                            bgColor="gray.950"
                            shadow="0 4px 12px black"
                            zIndex={0}
                          >
                            {isNextBattle && <Glow size="sm" />}
                            <Driver
                              driver={battle.driverLeft}
                              winnerId={battle.winnerId}
                              driverNo={getDriverNumber(battle.driverLeft)}
                            />
                            <Driver
                              driver={battle.driverRight}
                              winnerId={battle.winnerId}
                              driverNo={getDriverNumber(battle.driverRight)}
                            />
                          </Box>
                        </Box>

                        {i % 2 === 0 &&
                        battles.length > 1 &&
                        tournament.format !== TournamentsFormat.EXHIBITION ? (
                          <Box
                            borderRightWidth={1}
                            borderTopWidth={1}
                            borderBottomWidth={1}
                            borderStyle="dashed"
                            borderColor="gray.600"
                            flex={1}
                            my={-6}
                            borderRightRadius="lg"
                            position="relative"
                            zIndex={4}
                            pointerEvents="none"
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
    </>
  );
};

export default TournamentBattlesPage;
