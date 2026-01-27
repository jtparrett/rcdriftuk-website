import {
  redirect,
  useFetcher,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { z } from "zod";
import { Button, LinkButton } from "~/components/Button";
import { Box, Center, Container, Flex, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getUser } from "~/utils/getUser.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";
import { TournamentsState } from "~/utils/enums";
import { tournamentAddDrivers } from "~/utils/tournamentAddDrivers";
import { RiCheckboxCircleFill, RiTrophyLine, RiUserLine } from "react-icons/ri";
import type { Route } from "./+types/t.$code";
import { AppName } from "~/utils/enums";

export const loader = async (args: LoaderFunctionArgs) => {
  const code = z.string().parse(args.params.code);

  const tournament = await prisma.tournaments.findUnique({
    where: { inviteCode: code },
    select: {
      id: true,
      name: true,
      region: true,
      state: true,
      drivers: {
        select: {
          driverId: true,
        },
      },
    },
  });

  notFoundInvariant(tournament, "Invalid invite link");

  const { userId } = await getAuth(args);
  let isAlreadyJoined = false;
  let currentUser: {
    firstName: string | null;
    lastName: string | null;
    image: string | null;
  } | null = null;

  if (userId) {
    const user = await getUser(userId);
    if (user) {
      isAlreadyJoined = tournament.drivers.some(
        (d) => d.driverId === user.driverId,
      );
      currentUser = {
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
      };
    }
  }

  const canJoin =
    tournament.state === TournamentsState.START ||
    tournament.state === TournamentsState.QUALIFYING;

  return {
    tournament: {
      id: tournament.id,
      name: tournament.name,
      region: tournament.region,
      state: tournament.state,
      driverCount: tournament.drivers.length,
    },
    isLoggedIn: !!userId,
    isAlreadyJoined,
    canJoin,
    inviteCode: code,
    currentUser,
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const code = z.string().parse(args.params.code);
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "You must be logged in to join");

  const user = await getUser(userId);
  notFoundInvariant(user, "User not found");

  const tournament = await prisma.tournaments.findUnique({
    where: { inviteCode: code },
    select: {
      id: true,
      state: true,
      drivers: {
        select: {
          driverId: true,
        },
      },
    },
  });

  notFoundInvariant(tournament, "Invalid invite link");

  // Check if tournament allows joining
  const canJoin =
    tournament.state === TournamentsState.START ||
    tournament.state === TournamentsState.QUALIFYING;

  if (!canJoin) {
    throw new Response("Tournament is not accepting new drivers", {
      status: 400,
    });
  }

  // Check if already joined
  const isAlreadyJoined = tournament.drivers.some(
    (d) => d.driverId === user.driverId,
  );

  if (isAlreadyJoined) {
    return redirect(`/tournaments/${tournament.id}/overview`);
  }

  // Add the driver to the tournament
  await tournamentAddDrivers(tournament.id, [user.driverId], {
    createLaps: tournament.state !== TournamentsState.START,
  });

  return redirect(`/tournaments/${tournament.id}/overview`);
};

export const meta: Route.MetaFunction = ({ data }) => {
  return [
    { title: `${AppName} | Join ${data?.tournament.name ?? "Tournament"}` },
  ];
};

const JoinPage = () => {
  const {
    tournament,
    isLoggedIn,
    isAlreadyJoined,
    canJoin,
    inviteCode,
    currentUser,
  } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const isSubmitting = fetcher.state !== "idle";

  return (
    <Container maxW={500} px={4} py={8}>
      <Center flexDir="column" gap={6}>
        <Box
          w={16}
          h={16}
          rounded="2xl"
          bgGradient="to-t"
          gradientFrom="gray.700"
          gradientTo="gray.800"
          borderWidth={1}
          borderColor="gray.700"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <RiTrophyLine size={32} />
        </Box>

        <Box textAlign="center">
          <styled.h1 fontSize="2xl" fontWeight="bold" mb={2}>
            {tournament.name}
          </styled.h1>
          <styled.p color="gray.400">
            {tournament.region && (
              <styled.span>
                {tournament.region} Region
                {" · "}
              </styled.span>
            )}
            {tournament.driverCount}{" "}
            {tournament.driverCount === 1 ? "driver" : "drivers"} registered
          </styled.p>
        </Box>

        <Box
          w="full"
          p={6}
          rounded="2xl"
          borderWidth={1}
          borderColor="gray.800"
          bgColor="gray.900"
        >
          {!canJoin ? (
            <Flex
              flexDir="column"
              alignItems="center"
              gap={4}
              textAlign="center"
            >
              <styled.p color="gray.400">
                This tournament is no longer accepting new registrations.
              </styled.p>
              <LinkButton
                to={`/tournaments/${tournament.id}/overview`}
                w="full"
              >
                View Tournament
              </LinkButton>
            </Flex>
          ) : isAlreadyJoined ? (
            <Flex
              flexDir="column"
              alignItems="center"
              gap={4}
              textAlign="center"
            >
              <Flex alignItems="center" gap={2} color="green.400">
                <RiCheckboxCircleFill size={20} />
                <styled.span fontWeight="medium">
                  You're already registered
                </styled.span>
              </Flex>
              <LinkButton
                to={`/tournaments/${tournament.id}/overview`}
                w="full"
              >
                View Tournament
              </LinkButton>
            </Flex>
          ) : !isLoggedIn ? (
            <Flex
              flexDir="column"
              alignItems="center"
              gap={4}
              textAlign="center"
            >
              <styled.p color="gray.400">
                Sign in to join this tournament
              </styled.p>
              <LinkButton
                to={`/sign-in?redirect_url=/t/${inviteCode}`}
                w="full"
              >
                <RiUserLine />
                Sign In to Join
              </LinkButton>
            </Flex>
          ) : (
            <Flex
              flexDir="column"
              alignItems="center"
              gap={4}
              textAlign="center"
            >
              {currentUser && (
                <Flex alignItems="center" gap={2}>
                  <styled.img
                    src={currentUser.image ?? "/blank-driver-right.jpg"}
                    alt=""
                    w={8}
                    h={8}
                    rounded="full"
                    objectFit="cover"
                  />
                  <styled.span color="gray.400">
                    Joining as{" "}
                    <styled.span color="white" fontWeight="medium">
                      {currentUser.firstName} {currentUser.lastName}
                    </styled.span>
                  </styled.span>
                </Flex>
              )}
              <fetcher.Form method="post" style={{ width: "100%" }}>
                <Button
                  type="submit"
                  w="full"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Join Tournament
                </Button>
              </fetcher.Form>
            </Flex>
          )}
        </Box>
      </Center>
    </Container>
  );
};

export default JoinPage;
