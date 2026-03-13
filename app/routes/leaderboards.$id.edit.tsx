import { useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { FormControl } from "~/components/FormControl";
import { Label } from "~/components/Label";
import {
  Box,
  Container,
  Divider,
  Flex,
  Grid,
  styled,
  VStack,
} from "~/styled-system/jsx";
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
import { useCallback, useMemo, useRef, useState } from "react";
import { Reorder } from "motion/react";
import { RiDeleteBinFill, RiDraggable } from "react-icons/ri";
import { Dropdown, Option } from "~/components/Dropdown";
import { Card } from "~/components/CollapsibleCard";
import { useUserSearch } from "~/hooks/useUserSearch";
import { getPositionPoints } from "~/utils/leaderboardPoints";
import { Switch } from "~/components/Switch";

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

  const positionPointsRaw = formData.get("positionPoints");
  let positionPoints: Record<string, number> | null = null;
  if (positionPointsRaw && typeof positionPointsRaw === "string") {
    try {
      positionPoints = JSON.parse(positionPointsRaw);
    } catch {
      // ignore invalid JSON
    }
  }

  const data = actionSchema.parse({
    name: formData.get("name"),
    type: formData.get("type"),
    cutoff: Number(formData.get("cutoff")),
    tqPoints: Number(formData.get("tqPoints") ?? 0),
    participationPoints: Number(formData.get("participationPoints") ?? 0),
    positionPoints,
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
        tqPoints: data.tqPoints,
        participationPoints: data.participationPoints,
        positionPoints: data.positionPoints ?? undefined,
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
  tqPoints: z.number().min(0).max(100),
  participationPoints: z.number().min(0).max(100),
  positionPoints: z.record(z.string(), z.number()).nullable(),
  tournaments: z.array(z.string()),
  drivers: z.array(z.number()),
});

const clientSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(LeaderboardType),
  cutoff: z.number(),
  tqPoints: z.number().min(0).max(100),
  participationPoints: z.number().min(0).max(100),
  positionPoints: z.record(z.string(), z.number()),
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

const REPEAT_DELAY = 400;
const REPEAT_INTERVAL = 80;

const NumberStepper = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0.5,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  max?: number;
  label: string;
}) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const stopRepeating = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }, []);

  const startRepeating = useCallback(
    (delta: number) => {
      const tick = () => {
        const raw = valueRef.current + delta;
        const next = Math.max(min, Math.min(max, Math.round(raw * 10) / 10));
        onChange(next);
      };
      tick();
      timeoutRef.current = setTimeout(() => {
        intervalRef.current = setInterval(tick, REPEAT_INTERVAL);
      }, REPEAT_DELAY);
    },
    [min, max, onChange],
  );

  return (
    <Flex alignItems="center" w="full" gap={1} px={1}>
      <styled.span
        fontSize="2xs"
        color="gray.500"
        fontWeight="bold"
        flexShrink={0}
      >
        {label}
      </styled.span>
      <styled.button
        type="button"
        onPointerDown={() => startRepeating(-step)}
        onPointerUp={stopRepeating}
        onPointerLeave={stopRepeating}
        display="flex"
        alignItems="center"
        justifyContent="center"
        w={6}
        h={6}
        rounded="md"
        bgColor="gray.800"
        color="gray.400"
        cursor="pointer"
        flexShrink={0}
        fontSize="sm"
        fontWeight="bold"
        userSelect="none"
        _hover={{ bgColor: "gray.700", color: "white" }}
        _active={{ bgColor: "gray.600" }}
      >
        -
      </styled.button>
      <styled.span
        fontSize="xs"
        fontWeight="semibold"
        textAlign="center"
        flex={1}
        userSelect="none"
        color={value > 0 ? "white" : "gray.600"}
        fontVariantNumeric="tabular-nums"
      >
        {value.toFixed(1)}
      </styled.span>
      <styled.button
        type="button"
        onPointerDown={() => startRepeating(step)}
        onPointerUp={stopRepeating}
        onPointerLeave={stopRepeating}
        display="flex"
        alignItems="center"
        justifyContent="center"
        w={6}
        h={6}
        rounded="md"
        bgColor="gray.800"
        color="gray.400"
        cursor="pointer"
        flexShrink={0}
        fontSize="sm"
        fontWeight="bold"
        userSelect="none"
        _hover={{ bgColor: "gray.700", color: "white" }}
        _active={{ bgColor: "gray.600" }}
      >
        +
      </styled.button>
    </Flex>
  );
};

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

  const savedPoints = getPositionPoints(leaderboard.positionPoints);
  const initialPositionPoints: Record<string, number> = {};
  for (let i = 1; i <= 32; i++) {
    initialPositionPoints[String(i)] = savedPoints[i] ?? 0;
  }

  const formik = useFormik({
    validationSchema,
    initialValues: {
      name: leaderboard.name,
      type: leaderboard.type,
      cutoff: leaderboard.cutoff ?? 0,
      tqPoints: leaderboard.tqPoints,
      participationPoints: leaderboard.participationPoints,
      positionPoints: initialPositionPoints,
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
      formData.append("tqPoints", values.tqPoints.toString());
      formData.append(
        "participationPoints",
        values.participationPoints.toString(),
      );

      const filteredPoints: Record<string, number> = {};
      for (const [pos, pts] of Object.entries(values.positionPoints)) {
        if (pts > 0) filteredPoints[pos] = pts;
      }
      formData.append("positionPoints", JSON.stringify(filteredPoints));

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
        <Card p={4} overflow="visible">
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

              <Divider borderColor="gray.800" />

              <FormControl>
                <Flex alignItems="center" justifyContent="space-between" mb={1}>
                  <Label mb={0}>Qualifying Cutoff Position</Label>
                  <Switch
                    checked={formik.values.cutoff > 0}
                    onChange={(on) => {
                      formik.setFieldValue("cutoff", on ? 1 : 0);
                    }}
                  />
                </Flex>
                {formik.values.cutoff > 0 && (
                  <Input
                    type="number"
                    name="cutoff"
                    min={1}
                    onChange={formik.handleChange}
                    value={formik.values.cutoff}
                  />
                )}
              </FormControl>

              <Divider borderColor="gray.800" />

              <FormControl>
                <Flex alignItems="center" justifyContent="space-between" mb={1}>
                  <Label mb={0}>Top Qualifier (TQ) Bonus Points</Label>
                  <Switch
                    checked={formik.values.tqPoints > 0}
                    onChange={(on) => {
                      formik.setFieldValue("tqPoints", on ? 1 : 0);
                    }}
                  />
                </Flex>
                {formik.values.tqPoints > 0 && (
                  <>
                    <Input
                      type="number"
                      name="tqPoints"
                      min={1}
                      max={100}
                      onChange={formik.handleChange}
                      value={formik.values.tqPoints}
                    />
                    <styled.p fontSize="xs" color="gray.500" mt={1}>
                      Bonus points awarded to the top qualifier in each
                      tournament
                    </styled.p>
                  </>
                )}
              </FormControl>

              <Divider borderColor="gray.800" />

              <FormControl>
                <Flex alignItems="center" justifyContent="space-between" mb={1}>
                  <Label mb={0}>Participation Bonus</Label>
                  <Switch
                    checked={formik.values.participationPoints > 0}
                    onChange={(on) => {
                      formik.setFieldValue("participationPoints", on ? 1 : 0);
                    }}
                  />
                </Flex>
                {formik.values.participationPoints > 0 && (
                  <>
                    <Input
                      type="number"
                      name="participationPoints"
                      min={1}
                      max={100}
                      onChange={formik.handleChange}
                      value={formik.values.participationPoints}
                    />
                    <styled.p fontSize="xs" color="gray.500" mt={1}>
                      Bonus points awarded to every driver in each tournament
                    </styled.p>
                  </>
                )}
              </FormControl>

              <Divider borderColor="gray.800" />

              <FormControl>
                <Label>Points Distribution</Label>
                <styled.p fontSize="xs" color="gray.500" mb={2}>
                  Set points awarded for each finishing position (1-32). Leave
                  at 0 for no points.
                </styled.p>
                <Grid columns={4} gap={1.5}>
                  {Array.from({ length: 32 }, (_, i) => i + 1).map((pos) => (
                    <Box
                      key={pos}
                      bgColor="gray.900"
                      rounded="lg"
                      py={1.5}
                      px={1}
                      borderWidth={1}
                      borderColor="gray.800"
                    >
                      <NumberStepper
                        label={`P${pos}`}
                        value={formik.values.positionPoints[String(pos)] ?? 0}
                        onChange={(v) =>
                          formik.setFieldValue(`positionPoints.${pos}`, v)
                        }
                      />
                    </Box>
                  ))}
                </Grid>
              </FormControl>

              <Divider borderColor="gray.800" />

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
