import type { LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import { z } from "zod";
import { Box, styled, VStack, Flex } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri";
import { formatDistanceToNow } from "date-fns";
import { css } from "~/styled-system/css";
import { useState } from "react";
import notFoundInvariant from "~/utils/notFoundInvariant";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const driverId = z.coerce.number().parse(params.id);

  const driver = await prisma.users.findFirst({
    where: {
      driverId,
    },
    select: {
      driverId: true,
      image: true,
    },
  });

  notFoundInvariant(driver, "Driver not found");

  const battles = await prisma.tournamentBattles.findMany({
    where: {
      OR: [
        {
          driverLeft: {
            driverId,
          },
        },
        {
          driverRight: {
            driverId,
          },
        },
      ],
      tournament: {
        rated: true,
      },
    },
    orderBy: [
      {
        tournament: {
          createdAt: "asc",
        },
      },
      { round: "asc" },
      { bracket: "asc" },
      { id: "asc" },
    ],
    include: {
      tournament: {
        select: {
          id: true,
          createdAt: true,
          name: true,
        },
      },
      driverLeft: {
        include: {
          user: true,
        },
      },
      driverRight: {
        include: {
          user: true,
        },
      },
    },
  });

  return { battles, driver };
};

const Page = () => {
  const { battles, driver } = useLoaderData<typeof loader>();

  const [expandedBattles, setExpandedBattles] = useState<string[]>([]);

  const toggleBattle = (battleId: string) => {
    setExpandedBattles((prev) =>
      prev.includes(battleId)
        ? prev.filter((id) => id !== battleId)
        : [...prev, battleId],
    );
  };

  return (
    <VStack gap={4}>
      {[...battles].reverse().map((battle) => {
        const isLeftDriver = battle.driverLeft?.driverId === driver.driverId;
        const isWinner = isLeftDriver
          ? battle.winnerId === battle.driverLeft?.id
          : battle.winnerId === battle.driverRight?.id;

        const isExpanded = expandedBattles.includes(battle.id.toString());
        const startingElo = isWinner
          ? battle?.winnerStartingElo ?? 1000
          : battle?.loserStartingElo ?? 1000;
        const endingElo = isWinner
          ? battle?.winnerElo ?? 1000
          : battle?.loserElo ?? 1000;
        const pointsChange = endingElo - startingElo;

        const inactivityPenalty = isWinner
          ? battle?.winnerInactivityPenalty ?? 0
          : battle?.loserInactivityPenalty ?? 0;

        const opponentInactivityPenalty = isWinner
          ? battle?.loserInactivityPenalty ?? 0
          : battle?.winnerInactivityPenalty ?? 0;

        const opponentStartingElo = isWinner
          ? battle?.loserStartingElo ?? 1000
          : battle?.winnerStartingElo ?? 1000;

        const opponentElo = isWinner
          ? battle?.loserElo ?? 1000
          : battle?.winnerElo ?? 1000;

        const opponentPointsChange = opponentElo - opponentStartingElo;

        const isByeRun =
          battle.driverLeft?.driverId === 0 ||
          battle.driverRight?.driverId === 0;

        const color = isByeRun
          ? "yellow.500"
          : isWinner
            ? "green.500"
            : "red.500";
        const bgColor = isByeRun
          ? "yellow.950"
          : isWinner
            ? "green.950"
            : "red.950";

        return (
          <Box
            key={battle.id}
            bgColor={bgColor}
            p={1}
            rounded="2xl"
            width="full"
            cursor="pointer"
          >
            <Box
              borderRadius="xl"
              pos="relative"
              zIndex={1}
              borderWidth={1}
              borderColor={color}
            >
              <Box
                onClick={() => toggleBattle(battle.id.toString())}
                pos="absolute"
                inset={0}
                zIndex={1}
              />

              <styled.span
                fontSize="xs"
                color={color}
                pos="absolute"
                top={0}
                left={4}
                ml={-2}
                bgColor={bgColor}
                borderWidth={1}
                borderColor={color}
                fontWeight="semibold"
                px={2}
                py={1}
                rounded="full"
                lineHeight={1}
                transform="translateY(-50%)"
              >
                {formatDistanceToNow(battle.createdAt, {
                  addSuffix: true,
                })}
              </styled.span>

              <Flex p={4} alignItems="center" gap={3}>
                <Box
                  w={8}
                  h={8}
                  overflow="hidden"
                  rounded="md"
                  mb={1}
                  borderWidth={1}
                  borderColor={color}
                >
                  <styled.img
                    src={driver.image ?? "/blank-driver-right.jpg"}
                    w="full"
                    h="full"
                    objectFit="cover"
                  />
                </Box>

                {!isByeRun && (
                  <Box
                    w={8}
                    h={8}
                    overflow="hidden"
                    rounded="md"
                    ml={-9}
                    mt={1}
                    borderWidth={1}
                    borderColor={color}
                  >
                    <styled.img
                      src={
                        isLeftDriver
                          ? battle.driverRight?.user.image ??
                            "/blank-driver-right.jpg"
                          : battle.driverLeft?.user.image ??
                            "/blank-driver-right.jpg"
                      }
                      w="full"
                      h="full"
                      objectFit="cover"
                    />
                  </Box>
                )}

                <Box flex={1} overflow="hidden">
                  {!isByeRun && (
                    <styled.p
                      fontWeight="medium"
                      letterSpacing="tight"
                      lineHeight={1.1}
                    >
                      <styled.span color={isWinner ? "green.400" : "red.400"}>
                        {isWinner ? "Won vs" : "Lost vs"}
                      </styled.span>{" "}
                      <Link
                        to={`/drivers/${
                          isLeftDriver
                            ? battle.driverRight?.user.driverId
                            : battle.driverLeft?.user.driverId
                        }`}
                        className={css({
                          pos: "relative",
                          zIndex: 2,
                          _hover: {
                            textDecoration: "underline",
                          },
                        })}
                      >
                        {isLeftDriver
                          ? battle.driverRight?.user.firstName +
                            " " +
                            battle.driverRight?.user.lastName
                          : battle.driverLeft?.user.firstName +
                            " " +
                            battle.driverLeft?.user.lastName}
                      </Link>
                    </styled.p>
                  )}

                  {isByeRun && (
                    <styled.p
                      lineHeight={1.1}
                      color="yellow.400"
                      fontWeight="medium"
                      letterSpacing="tight"
                    >
                      BYE RUN
                    </styled.p>
                  )}

                  <Link
                    to={`/tournaments/${battle.tournament.id}/overview`}
                    className={css({
                      fontSize: "sm",
                      color: "gray.200",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      pos: "relative",
                      letterSpacing: "tight",
                      zIndex: 2,
                      _hover: {
                        textDecoration: "underline",
                      },
                    })}
                  >
                    {battle.tournament.name}
                  </Link>
                </Box>

                <styled.span
                  fontSize={{ base: "sm", md: "lg" }}
                  fontWeight="semibold"
                  color={pointsChange >= 0 ? "green.400" : "red.400"}
                >
                  {pointsChange > 0 ? "+" : ""}
                  {pointsChange.toFixed(3)}
                </styled.span>

                {isExpanded ? (
                  <RiArrowUpSLine size={20} />
                ) : (
                  <RiArrowDownSLine size={20} />
                )}
              </Flex>

              {isExpanded && (
                <Box borderTopWidth={1} borderColor={color}>
                  <Flex>
                    <Box p={4} flex={1}>
                      <styled.h4
                        fontSize="sm"
                        fontWeight="bold"
                        color="gray.400"
                        mb={1}
                      >
                        {isLeftDriver
                          ? battle.driverLeft?.user.firstName +
                            " " +
                            battle.driverLeft?.user.lastName
                          : battle.driverRight?.user.firstName +
                            " " +
                            battle.driverRight?.user.lastName}
                      </styled.h4>
                      {inactivityPenalty !== 0 && (
                        <styled.div fontSize="sm" color="red.300">
                          Inactivity Penalty: {inactivityPenalty.toFixed(3)}
                        </styled.div>
                      )}
                      <styled.div fontSize="sm" color="gray.300">
                        Starting: {startingElo.toFixed(3)}
                      </styled.div>
                      <styled.div fontSize="sm" color="gray.300">
                        Final: {endingElo.toFixed(3)}
                      </styled.div>
                      <styled.div
                        fontSize="sm"
                        color={pointsChange >= 0 ? "green.400" : "red.400"}
                      >
                        Change: {pointsChange >= 0 ? "+" : ""}
                        {pointsChange.toFixed(3)}
                      </styled.div>
                    </Box>

                    <Box w="1px" bgColor={color} />

                    <Box p={4} flex={1}>
                      <styled.h4
                        fontSize="sm"
                        fontWeight="bold"
                        color="gray.400"
                        mb={1}
                      >
                        {isLeftDriver
                          ? battle.driverRight?.user.firstName +
                            " " +
                            battle.driverRight?.user.lastName
                          : battle.driverLeft?.user.firstName +
                            " " +
                            battle.driverLeft?.user.lastName}
                      </styled.h4>
                      {opponentInactivityPenalty !== 0 && (
                        <styled.div fontSize="sm" color="red.300">
                          Inactivity Penalty:{" "}
                          {opponentInactivityPenalty.toFixed(3)}
                        </styled.div>
                      )}
                      <styled.div fontSize="sm" color="gray.300">
                        Starting: {opponentStartingElo.toFixed(3)}
                      </styled.div>
                      <styled.div fontSize="sm" color="gray.300">
                        Final: {opponentElo.toFixed(3)}
                      </styled.div>
                      <styled.div
                        fontSize="sm"
                        color={
                          opponentPointsChange >= 0 ? "green.400" : "red.400"
                        }
                      >
                        Change: {opponentPointsChange >= 0 ? "+" : ""}
                        {opponentPointsChange.toFixed(3)}
                      </styled.div>
                    </Box>
                  </Flex>
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </VStack>
  );
};

export default Page;
