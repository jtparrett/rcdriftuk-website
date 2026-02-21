import { useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { FormControl } from "~/components/FormControl";
import { Label } from "~/components/Label";
import { Box, Container, Flex, styled, VStack } from "~/styled-system/jsx";
import { z } from "zod";
import {
  redirect,
  useFetcher,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { Input } from "~/components/Input";
import { Button } from "~/components/Button";
import { TabButton, TabGroup } from "~/components/Tab";
import { LeaderboardType, TournamentsState } from "~/utils/enums";
import { capitalCase } from "change-case";
import { useMemo, useState } from "react";
import { Reorder } from "motion/react";
import { RiDeleteBinFill, RiDraggable } from "react-icons/ri";
import { Dropdown, Option } from "~/components/Dropdown";
import { Card } from "~/components/CollapsibleCard";
import { useUserSearch } from "~/hooks/useUserSearch";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  const id = z.string().parse(args.params.id);

  notFoundInvariant(userId, "User not found");

  const leaderboard = await prisma.leaderboards.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      drivers: {
        include: {
          driver: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      tournaments: true,
    },
  });

  notFoundInvariant(leaderboard, "Leaderboard not found");

  const tournaments = await prisma.tournaments.findMany({
    where: {
      state: TournamentsState.END,
      OR: [
        {
          userId,
        },
        {
          rated: true,
        },
      ],
    },
  });

  return {
    leaderboard,
    tournaments,
  };
};

export const action = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  const id = z.string().parse(args.params.id);
  const formData = await args.request.formData();

  const data = actionSchema.parse({
    name: formData.get("name"),
    type: formData.get("type"),
    cutoff: Number(formData.get("cutoff")),
    tournaments: formData.getAll("tournaments"),
    drivers: formData.getAll("drivers").map((driver) => Number(driver)),
  });

  await prisma.$transaction([
    prisma.leaderboardDrivers.deleteMany({
      where: {
        leaderboardId: id,
        leaderboard: {
          userId,
        },
      },
    }),
    prisma.leaderboardTournaments.deleteMany({
      where: {
        leaderboardId: id,
        leaderboard: {
          userId,
        },
      },
    }),
  ]);

  await prisma.$transaction([
    // Update leaderboard
    prisma.leaderboards.update({
      where: {
        id,
        userId,
      },
      data: {
        name: data.name,
        type: data.type,
        cutoff: data.cutoff,
      },
    }),

    // Create tournaments
    prisma.leaderboardTournaments.createMany({
      data: data.tournaments.map((tournamentId) => ({
        leaderboardId: id,
        tournamentId,
      })),
    }),

    // Create drivers
    prisma.leaderboardDrivers.createMany({
      data: data.drivers.map((driverId) => ({
        leaderboardId: id,
        driverId,
      })),
    }),
  ]);

  return redirect(`/leaderboards/${id}`);
};

const actionSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(LeaderboardType),
  cutoff: z.number(),
  tournaments: z.array(z.string()),
  drivers: z.array(z.number()),
});

const clientSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(LeaderboardType),
  cutoff: z.number(),
  tournaments: z.array(z.string()),
  drivers: z.array(
    z.object({
      driverId: z.number(),
      firstName: z.string().nullable().optional(),
      lastName: z.string().nullable().optional(),
    }),
  ),
});

const validationSchema = toFormikValidationSchema(clientSchema);

const TournamentsForm = ({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) => {
  const { tournaments } = useLoaderData<typeof loader>();
  const [focused, setFocused] = useState(false);
  const [search, setSearch] = useState("");

  const filteredTournaments = useMemo(() => {
    return tournaments.filter(
      (tournament) =>
        !value.includes(tournament.id) &&
        `${tournament.name}`.toLowerCase().includes(search.toLowerCase()),
    );
  }, [tournaments, value, search]);

  return (
    <Box>
      {value.length > 0 && (
        <Box
          bgColor="gray.900"
          rounded="lg"
          mb={2}
          overflow="hidden"
          borderWidth={1}
          borderColor="gray.800"
        >
          <Reorder.Group
            axis="y"
            values={value}
            onReorder={onChange}
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              marginBottom: "-1px",
            }}
          >
            {value.map((tournamentId, i) => {
              const tournament = tournaments.find(
                (tournament) => tournament.id === tournamentId,
              );

              return (
                <Reorder.Item
                  key={tournamentId}
                  value={tournamentId}
                  style={{ listStyle: "none" }}
                  whileDrag={{
                    zIndex: 1000,
                  }}
                  dragElastic={0.1}
                >
                  <Flex
                    gap={2}
                    borderBottomWidth={1}
                    borderBottomColor="gray.800"
                    cursor="grab"
                    _active={{ cursor: "grabbing" }}
                    transition="all 0.2s ease"
                    _hover={{ bgColor: "gray.800" }}
                    alignItems="center"
                    pl={2}
                  >
                    <RiDraggable size={16} />

                    <styled.p
                      flex={1}
                      userSelect="none"
                      whiteSpace="nowrap"
                      textOverflow="ellipsis"
                      overflow="hidden"
                      py={1}
                    >
                      {i + 1}.{" "}
                      {tournament ? `${tournament.name}` : tournamentId}
                    </styled.p>

                    <Box p={1}>
                      <Button
                        px={1}
                        size="xs"
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          onChange(value.filter((_id, index) => index !== i));
                        }}
                      >
                        <RiDeleteBinFill />
                      </Button>
                    </Box>
                  </Flex>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </Box>
      )}

      <Box pos="relative">
        <Input
          placeholder="Type to search..."
          onBlur={(_e) => {
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
            {filteredTournaments.length === 0 && (
              <styled.p px={2} py={1} fontWeight="semibold">
                No results found
              </styled.p>
            )}

            {filteredTournaments.map((tournament) => {
              return (
                <Option
                  key={tournament.id}
                  type="button"
                  onClick={() => {
                    onChange([...value, tournament.id]);
                    setSearch("");
                  }}
                >
                  {tournament.name}
                </Option>
              );
            })}
          </Dropdown>
        )}
      </Box>
    </Box>
  );
};

interface DriverEntry {
  driverId: number;
  firstName?: string | null;
  lastName?: string | null;
}

const PeopleForm = ({
  value,
  onChange,
}: {
  value: DriverEntry[];
  onChange: (value: DriverEntry[]) => void;
}) => {
  const [focused, setFocused] = useState(false);
  const [search, setSearch] = useState("");

  const { data: searchResults = [], isLoading } = useUserSearch(search);

  const selectedIds = new Set(value.map((v) => v.driverId));
  const filteredResults = searchResults.filter(
    (u) => !selectedIds.has(u.driverId),
  );

  return (
    <Box>
      {value.length > 0 && (
        <Box
          bgColor="gray.900"
          rounded="lg"
          mb={2}
          overflow="hidden"
          borderWidth={1}
          borderColor="gray.800"
        >
          <Reorder.Group
            axis="y"
            values={value}
            onReorder={onChange}
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              marginBottom: "-1px",
            }}
          >
            {value.map((entry, i) => {
              const displayName = entry.firstName
                ? `${entry.firstName} ${entry.lastName ?? ""}`.trim()
                : `Driver #${entry.driverId}`;

              return (
                <Reorder.Item
                  key={entry.driverId}
                  value={entry}
                  style={{ listStyle: "none" }}
                  whileDrag={{
                    zIndex: 1000,
                  }}
                  dragElastic={0.1}
                >
                  <Flex
                    gap={2}
                    borderBottomWidth={1}
                    borderBottomColor="gray.800"
                    cursor="grab"
                    _active={{ cursor: "grabbing" }}
                    transition="all 0.2s ease"
                    _hover={{ bgColor: "gray.800" }}
                    alignItems="center"
                    pl={2}
                  >
                    <RiDraggable size={16} />

                    <styled.p
                      flex={1}
                      userSelect="none"
                      whiteSpace="nowrap"
                      textOverflow="ellipsis"
                      overflow="hidden"
                      py={1}
                    >
                      {i + 1}. {displayName}
                    </styled.p>

                    <Box p={1}>
                      <Button
                        px={1}
                        size="xs"
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          onChange(value.filter((_id, index) => index !== i));
                        }}
                      >
                        <RiDeleteBinFill />
                      </Button>
                    </Box>
                  </Flex>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </Box>
      )}

      <Box pos="relative">
        <Input
          placeholder="Type to search..."
          onBlur={() => {
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
            {isLoading && (
              <styled.p px={2} py={1} color="gray.500">
                Searching...
              </styled.p>
            )}

            {!isLoading && filteredResults.length === 0 && (
              <styled.p px={2} py={1} fontWeight="semibold">
                No results found
              </styled.p>
            )}

            {filteredResults.map((user) => {
              return (
                <Option
                  key={user.driverId}
                  type="button"
                  onClick={() => {
                    onChange([
                      ...value,
                      {
                        driverId: user.driverId,
                        firstName: user.firstName,
                        lastName: user.lastName,
                      },
                    ]);
                    setSearch("");
                  }}
                >
                  <Flex alignItems="center" gap={2}>
                    <styled.img
                      src={user.image ?? "/blank-driver-right.jpg"}
                      alt={user.firstName ?? ""}
                      w={6}
                      h={6}
                      rounded="full"
                      objectFit="cover"
                    />
                    <styled.span>
                      {user.firstName} {user.lastName}
                    </styled.span>
                  </Flex>
                </Option>
              );
            })}
          </Dropdown>
        )}
      </Box>
    </Box>
  );
};

const LeaderboardsEditPage = () => {
  const fetcher = useFetcher();
  const { leaderboard } = useLoaderData<typeof loader>();

  const formik = useFormik({
    validationSchema,
    initialValues: {
      name: leaderboard.name,
      type: leaderboard.type,
      cutoff: leaderboard.cutoff ?? 0,
      drivers: leaderboard.drivers.map((driver) => ({
        driverId: driver.driverId,
        firstName: driver.driver.firstName,
        lastName: driver.driver.lastName,
      })),
      tournaments: leaderboard.tournaments.map(
        (tournament) => tournament.tournamentId,
      ),
    },
    async onSubmit(values) {
      const formData = new FormData();

      formData.append("name", values.name);
      formData.append("type", values.type);
      formData.append("cutoff", values.cutoff.toString());

      values.drivers.forEach((driver) => {
        formData.append("drivers", driver.driverId.toString());
      });
      values.tournaments.forEach((tournament) => {
        formData.append("tournaments", tournament);
      });

      await fetcher.submit(formData, {
        method: "POST",
      });
    },
  });

  return (
    <Container maxW={1100} px={2} py={4}>
      <Box maxW="580px" mx="auto">
        <styled.h2 mb={2}>Edit Leaderboard Details</styled.h2>
        <Card p={4}>
          <form onSubmit={formik.handleSubmit}>
            <VStack gap={4} alignItems="stretch">
              <FormControl error={formik.errors.name}>
                <Label>Leaderboard Name</Label>
                <Input
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                />
              </FormControl>

              <FormControl>
                <Label>Leaderboard Type</Label>
                <TabGroup>
                  {Object.values(LeaderboardType).map((item) => {
                    return (
                      <TabButton
                        key={item}
                        type="button"
                        isActive={formik.values.type === item}
                        onClick={() => formik.setFieldValue("type", item)}
                      >
                        {capitalCase(item)}
                      </TabButton>
                    );
                  })}
                </TabGroup>
              </FormControl>

              <FormControl>
                <Label>Qualifying Cutoff Position</Label>
                <Input
                  type="number"
                  name="cutoff"
                  onChange={formik.handleChange}
                  value={formik.values.cutoff}
                />
              </FormControl>

              {formik.values.type === LeaderboardType.TOURNAMENTS && (
                <FormControl>
                  <Label>Tournaments</Label>
                  <TournamentsForm
                    value={formik.values.tournaments}
                    onChange={(value) =>
                      formik.setFieldValue("tournaments", value)
                    }
                  />
                </FormControl>
              )}

              {formik.values.type === LeaderboardType.DRIVERS && (
                <FormControl>
                  <Label>Drivers</Label>
                  <PeopleForm
                    value={formik.values.drivers}
                    onChange={(value) => formik.setFieldValue("drivers", value)}
                  />
                </FormControl>
              )}

              <Button
                type="submit"
                isLoading={formik.isSubmitting}
                disabled={formik.isSubmitting}
              >
                Save Changes
              </Button>
            </VStack>
          </form>
        </Card>
      </Box>
    </Container>
  );
};

export default LeaderboardsEditPage;
