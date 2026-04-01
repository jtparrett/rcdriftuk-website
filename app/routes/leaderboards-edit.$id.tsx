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
  useParams,
  type LoaderFunctionArgs,
} from "react-router";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { Input } from "~/components/Input";
import { Button } from "~/components/Button";
import { TournamentsState } from "~/utils/enums";
import { useCallback, useMemo, useRef, useState } from "react";
import { Reorder } from "motion/react";
import { RiDeleteBinFill, RiDraggable, RiFileUploadLine } from "react-icons/ri";
import { Dropdown, Option } from "~/components/Dropdown";
import { Card } from "~/components/CollapsibleCard";
import { getPositionPoints } from "~/utils/leaderboardPoints";
import { Switch } from "~/components/Switch";
import { PeopleForm } from "~/components/PeopleForm";

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
      tournaments: true,
      drivers: {
        include: { user: true },
      },
    },
  });

  notFoundInvariant(leaderboard, "Leaderboard not found");

  const tournaments = await prisma.tournaments.findMany({
    where: {
      state: TournamentsState.END,
      archived: false,
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
    cutoff: Number(formData.get("cutoff")),
    tqPoints: Number(formData.get("tqPoints") ?? 0),
    participationPoints: Number(formData.get("participationPoints") ?? 0),
    positionPoints,
    tournaments: formData.getAll("tournaments"),
    registeredDrivers: formData.getAll("registeredDrivers"),
  });

  await prisma.$transaction([
    prisma.leaderboardTournaments.deleteMany({
      where: {
        leaderboardId: id,
        leaderboard: { userId },
      },
    }),

    prisma.leaderboardDrivers.deleteMany({
      where: {
        leaderboardId: id,
        leaderboard: { userId },
      },
    }),

    prisma.leaderboards.update({
      where: {
        id,
        userId,
      },
      data: {
        name: data.name,
        cutoff: data.cutoff,
        tqPoints: data.tqPoints,
        participationPoints: data.participationPoints,
        positionPoints: data.positionPoints ?? undefined,
      },
    }),

    prisma.leaderboardTournaments.createMany({
      data: data.tournaments.map((tournamentId) => ({
        leaderboardId: id,
        tournamentId,
      })),
    }),

    ...(data.registeredDrivers.length > 0
      ? [
          prisma.leaderboardDrivers.createMany({
            data: data.registeredDrivers.map((driverId) => ({
              leaderboardId: id,
              driverId: Number(driverId),
            })),
          }),
        ]
      : []),
  ]);

  return redirect(`/leaderboards/${id}`);
};

const actionSchema = z.object({
  name: z.string().min(1),
  cutoff: z.number(),
  tqPoints: z.number().min(0).max(100),
  participationPoints: z.number().min(0).max(100),
  positionPoints: z.record(z.string(), z.number()).nullable(),
  tournaments: z.array(z.string()),
  registeredDrivers: z.array(z.string()),
});

const clientSchema = z.object({
  name: z.string().min(1),
  cutoff: z.number(),
  tqPoints: z.number().min(0).max(100),
  participationPoints: z.number().min(0).max(100),
  positionPoints: z.record(z.string(), z.number()),
  tournaments: z.array(z.string()),
  registeredDrivers: z.array(
    z.object({
      driverId: z.string(),
      firstName: z.string().nullish(),
      lastName: z.string().nullish(),
      image: z.string().nullish(),
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

const LeaderboardsEditPage = () => {
  const fetcher = useFetcher();
  const csvFetcher = useFetcher();
  const params = useParams();
  const { leaderboard } = useLoaderData<typeof loader>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCsvImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    csvFetcher.submit(formData, {
      method: "POST",
      action: `/api/leaderboards/${params.id}/import-csv`,
      encType: "multipart/form-data",
    });

    event.target.value = "";
  };

  const savedPoints = getPositionPoints(leaderboard.positionPoints);
  const initialPositionPoints: Record<string, number> = {};
  for (let i = 1; i <= 32; i++) {
    initialPositionPoints[String(i)] = savedPoints[i] ?? 0;
  }

  const formik = useFormik({
    validationSchema,
    enableReinitialize: true,
    initialValues: {
      name: leaderboard.name,
      cutoff: leaderboard.cutoff ?? 0,
      tqPoints: leaderboard.tqPoints,
      participationPoints: leaderboard.participationPoints,
      positionPoints: initialPositionPoints,
      tournaments: leaderboard.tournaments.map(
        (tournament) => tournament.tournamentId,
      ),
      registeredDrivers: leaderboard.drivers.map((d) => ({
        driverId: d.driverId.toString(),
        firstName: d.user.firstName,
        lastName: d.user.lastName,
        image: d.user.image,
      })),
    },
    async onSubmit(values) {
      const formData = new FormData();

      formData.append("name", values.name);
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

      values.tournaments.forEach((tournament) => {
        formData.append("tournaments", tournament);
      });

      values.registeredDrivers.forEach((driver) => {
        formData.append("registeredDrivers", driver.driverId);
      });

      await fetcher.submit(formData, {
        method: "POST",
      });
    },
  });

  return (
    <Container maxW={640} px={2} py={4}>
      <styled.h2 mb={2}>Edit Leaderboard Details</styled.h2>
      <Card overflow="visible">
        <form onSubmit={formik.handleSubmit}>
          <VStack gap={0} alignItems="stretch">
            <FormControl error={formik.errors.name} p={4}>
              <Label>Leaderboard Name</Label>
              <Input
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
              />
            </FormControl>

            <Divider borderColor="gray.800" />

            <FormControl p={4}>
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

            <FormControl p={4}>
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
                    Bonus points awarded to the top qualifier in each tournament
                  </styled.p>
                </>
              )}
            </FormControl>

            <Divider borderColor="gray.800" />

            <FormControl p={4}>
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

            <FormControl p={4}>
              <Label>Points Distribution</Label>
              <styled.p fontSize="xs" color="gray.500" mb={2}>
                Set points awarded for each finishing position (1-32). Leave at
                0 for no points.
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

            <FormControl p={4}>
              <Label>Tournaments</Label>
              <TournamentsForm
                value={formik.values.tournaments}
                onChange={(value) => formik.setFieldValue("tournaments", value)}
              />
            </FormControl>

            <Divider borderColor="gray.800" />

            <FormControl p={4}>
              <Flex alignItems="center" justifyContent="space-between" mb={1}>
                <Label mb={0}>Registered Drivers</Label>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={handleCsvImport}
                  isLoading={csvFetcher.state !== "idle"}
                  disabled={csvFetcher.state !== "idle"}
                >
                  Import CSV <RiFileUploadLine />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </Flex>
              <styled.p fontSize="xs" color="gray.500" mb={2}>
                Only registered drivers will appear in standings. Leave empty to
                show all drivers.
              </styled.p>
              <PeopleForm
                name="registeredDrivers"
                value={formik.values.registeredDrivers}
                onChange={(value) =>
                  formik.setFieldValue("registeredDrivers", value)
                }
              />
            </FormControl>

            <Divider borderColor="gray.800" />

            <Button
              type="submit"
              isLoading={formik.isSubmitting}
              disabled={formik.isSubmitting}
              m={4}
            >
              Save Changes
            </Button>
          </VStack>
        </form>
      </Card>
    </Container>
  );
};

export default LeaderboardsEditPage;
