import { MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { HiChevronDown, HiChevronUp } from "react-icons/hi";
import { Header } from "~/components/Header";
import { styled, Container, Box } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { useDisclosure } from "~/utils/useDisclosure";

export const meta: MetaFunction = () => {
  return [
    {
      title: `RC Drift UK | Driver Ratings`,
      description:
        "RC Drift UK Ratings, see where you rank amoungst some of the best drivers in the UK.",
      "og:title": "RC Drift UK | Driver Ratings",
      "og:description":
        "RC Drift UK Ratings, see where you rank amoungst some of the best drivers in the UK.",
    },
  ];
};

function calculateElo(
  ratingPlayer: number,
  ratingOpponent: number,
  K: number,
  isPlayerWin: boolean
) {
  // Calculate expected score
  let expectedScorePlayer =
    1 / (1 + Math.pow(10, (ratingOpponent - ratingPlayer) / 400));

  // Calculate actual score
  let actualScorePlayer = isPlayerWin ? 1 : 0; // assuming only win/lose, no draw

  // Calculate new rating
  let newRatingPlayer =
    ratingPlayer + K * (actualScorePlayer - expectedScorePlayer);

  return newRatingPlayer;
}

export const loader = async () => {
  let K = 64; // K-factor

  const battles = await prisma.battles.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      driverLeft: true,
      driverRight: true,
    },
  });

  const driverElos: Record<
    string,
    {
      elo: number;
      breakdown: {
        battle: (typeof battles)[number];
        points: number;
      }[];
    }
  > = {};

  for (const battle of battles) {
    const [winner, loser] =
      battle.winnerId === battle.driverLeftId
        ? [battle.driverLeft, battle.driverRight]
        : [battle.driverRight, battle.driverLeft];

    if (winner && loser) {
      driverElos[winner.id] = driverElos?.[winner.id] ?? {};
      driverElos[loser.id] = driverElos?.[loser.id] ?? {};

      const winnerElo = calculateElo(
        driverElos[winner.id].elo ?? 1000,
        driverElos[loser.id].elo ?? 1000,
        K,
        true
      );

      const loserElo = calculateElo(
        driverElos[loser.id].elo ?? 1000,
        driverElos[winner.id].elo ?? 1000,
        K,
        false
      );

      driverElos[winner.id].elo = winnerElo;
      driverElos[loser.id].elo = loserElo;

      driverElos[winner.id].breakdown = [
        ...(driverElos[winner.id].breakdown ?? []),
        {
          battle: battle,
          points: winnerElo,
        },
      ];

      driverElos[loser.id].breakdown = [
        ...(driverElos[loser.id].breakdown ?? []),
        {
          battle: battle,
          points: loserElo,
        },
      ];
    }
  }

  const allDrivers = await prisma.drivers.findMany({
    where: {
      id: {
        in: Object.keys(driverElos),
      },
    },
  });

  const drivers = Object.keys(driverElos)
    .map((id) => {
      return {
        id,
        points: driverElos[id].elo,
        name: allDrivers.find((driver) => driver.id === id)?.name,
        breakdown: driverElos[id].breakdown,
      };
    })
    .sort((a, b) => {
      //@ts-ignore
      return b.points - a.points;
    });

  return drivers;
};

type LoaderData = typeof loader;

const RatingsPage = () => {
  const drivers = useLoaderData<LoaderData>();

  const Row = ({
    driver,
    rank,
  }: {
    driver: Awaited<ReturnType<LoaderData>>[number];
    rank: number;
  }) => {
    const { isOpen, toggle } = useDisclosure();

    return (
      <>
        <styled.tr
          backgroundColor={isOpen ? "gray.800" : undefined}
          onClick={() => toggle()}
        >
          <styled.td fontFamily="mono" pl={2}>
            {rank}
          </styled.td>
          <td>{driver.name}</td>
          <styled.td textAlign="right" fontFamily="mono">
            {driver.points.toFixed(3)}
          </styled.td>
          <styled.td w={50}>
            <Box p={3} fontSize="2xl">
              {isOpen ? <HiChevronUp /> : <HiChevronDown />}
            </Box>
          </styled.td>
        </styled.tr>
        {isOpen && (
          <styled.tr>
            <td colSpan={4}>
              <Box
                px={4}
                py={2}
                borderTopWidth={1}
                borderColor="gray.500"
                backgroundColor="gray.800"
                mb={2}
              >
                {driver.breakdown.map((item) => {
                  const [left, right] =
                    item.battle.driverLeftId === driver.id
                      ? [item.battle.driverLeft, item.battle.driverRight]
                      : [item.battle.driverRight, item.battle.driverLeft];

                  return (
                    <p key={item.battle.id}>
                      <styled.span
                        color={
                          left?.id === item.battle.winnerId
                            ? "green.400"
                            : "red.400"
                        }
                      >
                        {left?.name}
                      </styled.span>{" "}
                      <styled.span color="gray.400">vs</styled.span>{" "}
                      <styled.span
                        color={
                          right?.id === item.battle.winnerId
                            ? "green.400"
                            : "red.400"
                        }
                      >
                        {right?.name}
                      </styled.span>{" "}
                      - {item.points.toFixed(3)} - {item.battle.tournament}
                    </p>
                  );
                })}
              </Box>
            </td>
          </styled.tr>
        )}
      </>
    );
  };

  return (
    <Container pb={12} maxW={1100} px={2}>
      <Header />

      <styled.h1 fontSize="4xl" fontWeight="extrabold">
        Driver Ratings
      </styled.h1>

      <styled.p>
        See where you rank amoungst some of the best drivers in the UK.
        <br />
        Calculated using driver battle progression at UK ran tournaments.
      </styled.p>

      <Box maxW={200} h="4px" bgColor="brand.500" mt={2} mb={6} />

      <Box
        mt={6}
        borderWidth={1}
        borderColor="gray.600"
        p={4}
        maxW={720}
        rounded="md"
      >
        <styled.table w="full">
          <thead>
            <tr>
              <styled.th textAlign="left" pl={2} w="50px">
                #
              </styled.th>
              <styled.th textAlign="left">Name</styled.th>
              <styled.th textAlign="right">Points</styled.th>
              <th />
            </tr>
          </thead>
          <tbody>
            {drivers
              .filter((driver) => driver.name !== "BUY")
              .map((driver, i) => {
                // @ts-ignore
                return <Row key={driver.id} driver={driver} rank={i + 1} />;
              })}
          </tbody>
        </styled.table>
      </Box>
    </Container>
  );
};

export default RatingsPage;
