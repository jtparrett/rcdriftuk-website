import { useCallback, useEffect, useRef, useState } from "react";
import {
  RiCheckboxCircleLine,
  RiFileCopyLine,
  RiFileUploadLine,
  RiShuffleLine,
} from "react-icons/ri";
import {
  redirect,
  useFetcher,
  useLoaderData,
  useNavigation,
  useParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { z } from "zod";
import { Button } from "~/components/Button";
import { Card } from "~/components/CollapsibleCard";
import { PeopleForm } from "~/components/CreateTournamentForm";
import { DashedLine } from "~/components/DashedLine";
import { Input } from "~/components/Input";
import { Spinner } from "~/components/Spinner";
import { Box, Flex, Spacer, styled } from "~/styled-system/jsx";
import { TournamentsState } from "~/utils/enums";
import { getAuth } from "~/utils/getAuth.server";
import { getUsers } from "~/utils/getUsers.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  const id = z.string().parse(args.params.id);
  const users = await getUsers();

  const tournament = await prisma.tournaments.findUnique({
    where: {
      id,
      userId,
    },
    include: {
      drivers: true,
    },
  });

  notFoundInvariant(tournament, "Tournament not found");

  if (tournament.state !== TournamentsState.REGISTRATION) {
    throw redirect(`/tournaments/${id}/overview`);
  }

  return { users, tournament };
};

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);
  const id = z.string().parse(args.params.id);
  const body = await args.request.json();
  const drivers = z.array(z.object({ driverId: z.string() })).parse(body);

  notFoundInvariant(userId, "User not found");

  const tournament = await prisma.tournaments.findUnique({
    where: {
      id,
      userId,
    },
    include: {
      drivers: true,
    },
  });

  notFoundInvariant(tournament, "Tournament not found");

  // Find new drivers (those with non-numeric driverIds) and their indices
  const newDriversWithIndex = drivers
    .map((driver, index) => ({ driver, index }))
    .filter(({ driver }) => isNaN(Number(driver.driverId)));

  // Create users for new drivers
  const createdUsers = await prisma.users.createManyAndReturn({
    data: newDriversWithIndex.map(({ driver }) => {
      const nameParts = driver.driverId.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      return { firstName, lastName };
    }),
  });

  // Splice the created users back into the drivers array at their original positions
  const resolvedDrivers = [...drivers];
  newDriversWithIndex.forEach(({ index }, i) => {
    resolvedDrivers[index] = { driverId: String(createdUsers[i].driverId) };
  });

  await prisma.tournamentDrivers.deleteMany({
    where: {
      tournamentId: id,
    },
  });

  await prisma.tournamentDrivers.createMany({
    data: resolvedDrivers.map((driver, i) => ({
      tournamentId: id,
      driverId: Number(driver.driverId),
      tournamentDriverNumber: tournament.drivers.length + i + 1,
    })),
  });

  return null;
};

const Page = () => {
  const params = useParams();
  const id = z.string().parse(params.id);
  const { users, tournament } = useLoaderData<typeof loader>();
  const [isCopied, setIsCopied] = useState(false);
  const [drivers, setDrivers] = useState<{ driverId: string }[]>(
    tournament.drivers.map((driver) => ({
      driverId: String(driver.driverId),
    })),
  );
  const fetcher = useFetcher();
  const transition = useNavigation();
  const isSubmitting = transition.state !== "idle";
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inviteLink = `https://rcdrift.io/t/${id}`;

  useEffect(() => {
    setDrivers(
      tournament.drivers.map((driver) => ({
        driverId: String(driver.driverId),
      })),
    );
  }, [tournament]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const debouncedSubmit = useCallback(
    (drivers: { driverId: string }[]) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        fetcher.submit(JSON.stringify(drivers), {
          method: "POST",
          encType: "application/json",
        });
      }, 1000);
    },
    [fetcher],
  );

  const addDrivers = (newDrivers: { driverId: string }[]) => {
    setDrivers(newDrivers);
    debouncedSubmit(newDrivers);
  };

  return (
    <Flex flexDir="column" gap={4}>
      <Card overflow="visible">
        <Flex py={2} px={4} gap={2} alignItems="center">
          <styled.h2 fontWeight="medium" fontSize="lg">
            Drivers
          </styled.h2>
          <Spacer />
          {isSubmitting && <Spinner />}
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => {
              addDrivers([...drivers].sort(() => Math.random() - 0.5));
            }}
          >
            Shuffle
            <RiShuffleLine />
          </Button>
          <Button variant="outline" size="sm" type="button">
            Import CSV <RiFileUploadLine />
          </Button>
        </Flex>
        <DashedLine />
        <Box p={4}>
          <PeopleForm
            users={users}
            name="drivers"
            onChange={addDrivers}
            value={drivers}
            allowNewDrivers
          />
        </Box>
      </Card>

      <Card>
        <Box py={2} px={4}>
          <styled.h2 fontWeight="medium" fontSize="lg">
            Share invite link
          </styled.h2>
        </Box>
        <DashedLine />
        <Box p={4}>
          <Flex bgColor="gray.800" rounded="xl">
            <Input readOnly value={inviteLink} color="gray.400" />
            <Button
              variant={isCopied ? "primary" : "secondary"}
              onClick={handleCopy}
            >
              {isCopied ? <RiCheckboxCircleLine /> : <RiFileCopyLine />}
            </Button>
          </Flex>
        </Box>
      </Card>
    </Flex>
  );
};

export default Page;
