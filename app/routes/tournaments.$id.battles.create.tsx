import { useMemo, useState } from "react";
import {
  Form,
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import invariant from "~/utils/invariant";
import z from "zod";
import { Button } from "~/components/Button";
import { Dropdown, Option } from "~/components/Dropdown";
import { Input } from "~/components/Input";
import { Label } from "~/components/Label";
import { Box, styled, VStack } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getUsers, type GetUsers } from "~/utils/getUsers.server";
import { prisma } from "~/utils/prisma.server";
import { tournamentAdvanceBattles } from "~/utils/tournamentAdvanceBattles";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  await prisma.tournaments.findFirstOrThrow({
    where: {
      id,
      userId,
    },
  });

  const users = await getUsers();

  return { users };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  const tournament = await prisma.tournaments.findFirstOrThrow({
    where: {
      id,
      userId,
    },
    include: {
      drivers: {
        select: {
          id: true,
          driverId: true,
        },
      },
    },
  });

  const formData = await request.formData();
  let { driverLeftId, driverRightId } = z
    .object({
      driverLeftId: z.string(),
      driverRightId: z.string(),
    })
    .parse({
      driverLeftId: formData.get("driverLeftId"),
      driverRightId: formData.get("driverRightId"),
    });

  if (!/^\d+$/.test(driverLeftId)) {
    const [firstName, lastName] = driverLeftId.split(" ");

    if (!firstName?.trim() || !lastName?.trim()) {
      throw new Error(
        `Invalid left driver name: "${driverLeftId}". Please provide both first and last name.`,
      );
    }

    const user = await prisma.users.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      },
    });

    driverLeftId = user.driverId.toString();
  }

  if (!/^\d+$/.test(driverRightId)) {
    const [firstName, lastName] = driverRightId.split(" ");

    if (!firstName?.trim() || !lastName?.trim()) {
      throw new Error(
        `Invalid right driver name: "${driverRightId}". Please provide both first and last name.`,
      );
    }

    const user = await prisma.users.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      },
    });

    driverRightId = user.driverId.toString();
  }

  let driverLeft = tournament.drivers.find(
    (driver) => driver.driverId === Number(driverLeftId),
  );

  let driverRight = tournament.drivers.find(
    (driver) => driver.driverId === Number(driverRightId),
  );

  if (!driverLeft) {
    driverLeft = await prisma.tournamentDrivers.create({
      data: {
        tournamentId: id,
        driverId: Number(driverLeftId),
      },
    });
  }

  if (!driverRight) {
    driverRight = await prisma.tournamentDrivers.create({
      data: {
        tournamentId: id,
        driverId: Number(driverRightId),
      },
    });
  }

  await prisma.tournamentBattles.create({
    data: {
      tournamentId: id,
      driverLeftId: driverLeft.id,
      driverRightId: driverRight.id,
      round: 1000,
    },
  });

  await tournamentAdvanceBattles(id);

  return redirect(`/tournaments/${id}/overview`);
};

const DriverSelect = ({ name }: { name: string }) => {
  const { users } = useLoaderData<typeof loader>();
  const [focused, setFocused] = useState(false);
  const [search, setSearch] = useState("");
  const [value, onChange] = useState<number | string>();

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        value !== user.driverId &&
        `${user.firstName} ${user.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  }, [users, value, search]);

  return (
    <Box pos="relative">
      <input type="hidden" name={name} value={value} />
      <Input
        placeholder="Type to search..."
        onBlur={(e) => {
          setTimeout(() => {
            const active = document.activeElement;
            const listbox = document.querySelector('[role="listbox"]');
            if (!listbox?.contains(active)) {
              setFocused(false);
            }
          }, 300);
        }}
        onFocus={() => setFocused(true)}
        onChange={(e) => setSearch(e.target.value)}
        value={search}
      />
      {focused && search.length > 0 && (
        <Dropdown role="listbox">
          {filteredUsers.length === 0 && (
            <styled.p px={2} py={1} fontWeight="semibold">
              No results found
            </styled.p>
          )}

          {filteredUsers.map((user) => {
            return (
              <Option
                key={user.driverId}
                type="button"
                onClick={() => {
                  onChange(user.driverId);
                  setSearch(`${user.firstName} ${user.lastName}`);
                  setFocused(false);
                }}
              >
                {user.firstName} {user.lastName}
              </Option>
            );
          })}

          <Option
            type="button"
            onClick={() => {
              onChange(search);
              setFocused(false);
            }}
          >
            Create "{search}" as a new driver
          </Option>
        </Dropdown>
      )}
    </Box>
  );
};

const BattleCreatePage = () => {
  return (
    <Box p={6} bgColor="gray.900" rounded="2xl" maxW="500px">
      <Form method="post">
        <VStack gap={4} alignItems="stretch">
          <styled.h1 fontSize="2xl" fontWeight="bold">
            Create Next Battle
          </styled.h1>

          <Box>
            <Label>Driver A</Label>
            <DriverSelect name="driverLeftId" />
          </Box>
          <Box>
            <Label>Driver B</Label>
            <DriverSelect name="driverRightId" />
          </Box>
          <Button type="submit">Create Next Battle</Button>
        </VStack>
      </Form>
    </Box>
  );
};

export default BattleCreatePage;
