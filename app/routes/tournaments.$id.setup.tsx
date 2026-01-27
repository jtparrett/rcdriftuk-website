import { capitalCase } from "change-case";
import { useFormik } from "formik";
import {
  RiClipboardLine,
  RiFileUploadLine,
  RiLink,
  RiRefreshLine,
  RiShieldCheckLine,
  RiShuffleLine,
  RiSwordLine,
  RiUser3Line,
} from "react-icons/ri";
import {
  useFetcher,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { Button } from "~/components/Button";
import { Card, CardContent, CardHeader } from "~/components/CollapsibleCard";
import { FormControl } from "~/components/FormControl";
import { Input } from "~/components/Input";
import { Label } from "~/components/Label";
import { Select } from "~/components/Select";
import { TabButton, TabGroup } from "~/components/Tab";
import { PeopleForm } from "~/components/PeopleForm";
import { Box, Flex, Spacer, styled } from "~/styled-system/jsx";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";
import {
  BracketSize,
  JudgingInterface,
  TournamentsDriverNumbers,
  QualifyingOrder,
  Regions,
  ScoreFormula,
  TournamentsFormat,
  TournamentsState,
  getScoreFormulaOptions,
} from "~/utils/enums";
import { useParams } from "react-router";
import { getAuth } from "~/utils/getAuth.server";
import { getUsers } from "~/utils/getUsers.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";
import { tournamentCreateBattles } from "~/utils/tournamentCreateBattles";
import { tournamentSeedBattles } from "~/utils/tournamentSeedBattles";
import { tournamentAddDrivers } from "~/utils/tournamentAddDrivers";
import { tournamentCreateLaps } from "~/utils/tournamentCreateLaps";
import { tournamentRemoveDrivers } from "~/utils/tournamentRemoveDrivers";
import { tournamentReorderDrivers } from "~/utils/tournamentReorderDrivers";
import { findNextIncompleteQualifyingLap } from "~/utils/findNextIncompleteQualifyingLap";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

export const tournamentFormSchema = z.object({
  name: z.string().min(1, "Tournament name is required"),
  enableQualifying: z.boolean(),
  enableBattles: z.boolean(),
  drivers: z
    .array(
      z.object({
        driverId: z.string(),
        isNew: z.boolean().optional(),
      }),
    )
    .min(1, "Please add at least one driver to the tournament"),
  judges: z
    .array(
      z.object({
        driverId: z.string(),
        points: z.coerce.number(),
      }),
    )
    .min(1, "Please add at least one judge to the tournament"),
  qualifyingLaps: z.coerce
    .number()
    .min(1, "Qualifying laps must be at least 1")
    .max(3, "Qualifying laps must be at most 3"),
  format: z.nativeEnum(TournamentsFormat),
  enableProtests: z.boolean(),
  region: z.nativeEnum(Regions),
  scoreFormula: z.nativeEnum(ScoreFormula),
  qualifyingOrder: z.nativeEnum(QualifyingOrder),
  driverNumbers: z.nativeEnum(TournamentsDriverNumbers),
  bracketSize: z.nativeEnum(BracketSize),
  ratingRequested: z.boolean(),
  judgingInterface: z.nativeEnum(JudgingInterface),
});

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
      drivers: {
        orderBy: {
          tournamentDriverNumber: "asc",
        },
      },
      judges: true,
    },
  });

  notFoundInvariant(tournament, "Tournament not found");

  return { users, tournament };
};

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);
  const id = z.string().parse(args.params.id);
  const body = await args.request.json();
  const data = tournamentFormSchema.parse(body);

  notFoundInvariant(userId, "User not found");

  // First fetch current state to determine what can be edited
  const currentTournament = await prisma.tournaments.findFirst({
    where: { id, userId },
    select: {
      state: true,
      format: true,
      bracketSize: true,
    },
  });

  notFoundInvariant(currentTournament, "Tournament not found");

  const isStartState = currentTournament.state === TournamentsState.START;

  const tournament = await prisma.tournaments.update({
    where: {
      id,
      userId,
    },
    data: {
      name: data.name,
      enableQualifying: isStartState ? data.enableQualifying : undefined,
      enableBattles: isStartState ? data.enableBattles : undefined,
      qualifyingLaps: isStartState ? data.qualifyingLaps : undefined,
      format: data.format,
      enableProtests: data.enableProtests,
      region: data.region,
      scoreFormula: data.scoreFormula,
      qualifyingOrder: data.qualifyingOrder,
      driverNumbers: data.driverNumbers,
      bracketSize: data.bracketSize,
      ratingRequested: data.ratingRequested,
      judgingInterface: data.judgingInterface,
    },
    include: {
      judges: true,
      drivers: true,
    },
  });

  const canEditDrivers =
    isStartState || tournament.state === TournamentsState.QUALIFYING;

  // Compare drivers
  const currentDriverIds = tournament.drivers.map((d) => d.driverId.toString());
  const newDrivers = data.drivers.filter((d) => d.isNew);

  // Create new users first if needed and build a mapping from name to generated ID
  const newUserIdMap: Record<string, string> = {};
  if (newDrivers.length > 0) {
    const newUsers = await prisma.users.createManyAndReturn({
      data: newDrivers.map((d) => {
        const [firstName, lastName] = d.driverId.split(" ");

        return {
          firstName: firstName,
          lastName: lastName,
        };
      }),
    });

    // Map original driverId (name) to the generated ID
    newDrivers.forEach((driver, i) => {
      const newUser = newUsers[i];
      if (newUser?.driverId) {
        newUserIdMap[driver.driverId] = newUser.driverId.toString();
      }
    });
  }

  // Build submittedDriverIds with all drivers (including newly created) in correct order
  const submittedDriverIds = data.drivers.map((d) =>
    d.isNew ? newUserIdMap[d.driverId] : d.driverId,
  );

  const newlyAddedDrivers = submittedDriverIds.filter(
    (id) => !currentDriverIds.includes(id),
  );
  const removedDrivers = currentDriverIds.filter(
    (id) => !submittedDriverIds.includes(id),
  );
  const driversOrderChanged =
    JSON.stringify(currentDriverIds) !== JSON.stringify(submittedDriverIds);

  // Handle driver changes (only if allowed)
  if (canEditDrivers) {
    if (removedDrivers.length > 0) {
      await tournamentRemoveDrivers(id, removedDrivers.map(Number));
    }

    if (newlyAddedDrivers.length > 0) {
      await tournamentAddDrivers(id, newlyAddedDrivers.map(Number), {
        createLaps: !isStartState,
      });
    }

    // Always reorder after adds/removes to ensure correct order
    if (driversOrderChanged && isStartState) {
      await tournamentReorderDrivers(id, submittedDriverIds.map(Number));
    }
  }

  // Create qualifying laps when in START state with qualifying enabled
  if (isStartState && data.enableQualifying) {
    await tournamentCreateLaps(id);
  }

  // Handle judge changes (only if allowed)
  // Since we're in START state, we can simply delete all and re-create
  if (isStartState) {
    // Delete all existing judges
    await prisma.tournamentJudges.deleteMany({
      where: { tournamentId: id },
    });

    // Create all judges fresh
    await prisma.tournamentJudges.createMany({
      data: data.judges.map((judge) => ({
        tournamentId: id,
        driverId: Number(judge.driverId),
        points: judge.points,
      })),
    });
  }

  const shouldUpdateBattles =
    tournament.enableBattles &&
    (currentTournament.format !== data.format ||
      currentTournament.bracketSize !== data.bracketSize);

  if (shouldUpdateBattles) {
    await tournamentCreateBattles(id);

    if (tournament.state === TournamentsState.BATTLES) {
      await tournamentSeedBattles(id);
    }
  }

  // Update nextQualifyingLapId if qualifying is enabled and we're in QUALIFYING state
  // This handles the case where the current lap's driver was deleted
  if (
    tournament.enableQualifying &&
    tournament.state === TournamentsState.QUALIFYING
  ) {
    const nextQualifyingLap = await findNextIncompleteQualifyingLap(
      id,
      tournament.qualifyingOrder,
    );

    await prisma.tournaments.update({
      where: { id },
      data: {
        nextQualifyingLapId: nextQualifyingLap?.id ?? null,
      },
    });
  }

  return null;
};

const Icon = styled("div", {
  base: {
    flex: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    rounded: "xl",
    bgGradient: "to-t",
    gradientFrom: "gray.700",
    gradientTo: "gray.800",
    w: 10,
    h: 10,
    borderWidth: 1,
    borderColor: "gray.700",
  },
});

type User = {
  driverId: number;
  firstName: string | null;
  lastName: string | null;
};

// Map legacy values to new equivalents
const mapLegacyFormula = (formula: ScoreFormula): ScoreFormula => {
  if (formula === ScoreFormula.CUMULATIVE) return ScoreFormula.SUM;
  if (formula === ScoreFormula.AVERAGED) return ScoreFormula.AVERAGE;
  return formula;
};

const ScoreFormulaSelect = ({
  judgeCount,
  users,
  judgeIds,
  value,
  onChange,
  error,
}: {
  judgeCount: number;
  users: User[];
  judgeIds: string[];
  value: ScoreFormula;
  onChange: (value: ScoreFormula) => void;
  error?: string;
}) => {
  // Map legacy values to their new equivalents
  const normalizedValue = mapLegacyFormula(value);

  // Get judge names in order (format: "FirstName L.")
  const judgeNames = judgeIds
    .map((id) => {
      const user = users.find((u) => u.driverId.toString() === id);
      if (!user?.firstName) return `Judge ${id}`;
      const lastInitial = user.lastName?.charAt(0).toUpperCase();
      return lastInitial ? `${user.firstName} ${lastInitial}` : user.firstName;
    })
    .slice(0, judgeCount);

  const options = getScoreFormulaOptions(judgeCount, judgeNames);

  // Check if current value is valid for judge count
  const isCurrentValueValid = options.some(
    (opt) => opt.value === normalizedValue,
  );
  const effectiveValue = isCurrentValueValid
    ? normalizedValue
    : options[0]?.value;

  // Auto-select valid option if current value is invalid or a legacy value
  useEffect(() => {
    const needsUpdate =
      !isCurrentValueValid ||
      (value !== normalizedValue && effectiveValue !== value);
    if (needsUpdate && options.length > 0 && effectiveValue) {
      onChange(effectiveValue);
    }
  }, [
    isCurrentValueValid,
    options.length,
    effectiveValue,
    normalizedValue,
    value,
    onChange,
  ]);

  if (judgeCount <= 1) {
    return (
      <FormControl flex={1} error={error}>
        <Label>Score Formula</Label>
        <styled.p fontSize="sm" color="gray.400">
          Option unavailable for single judge.
        </styled.p>
      </FormControl>
    );
  }

  return (
    <FormControl flex={1} error={error}>
      <Label>Score Formula</Label>
      <Select
        value={effectiveValue}
        onChange={(e) => onChange(e.target.value as ScoreFormula)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}: {option.formula}
          </option>
        ))}
      </Select>
      <styled.p fontSize="sm" color="gray.500" mt={1}>
        {judgeNames.length > 0 && (
          <>
            Where{" "}
            {judgeNames.map((name, i) => (
              <span key={i}>
                <styled.span fontWeight="medium" color="white">
                  {String.fromCharCode(65 + i)}
                </styled.span>
                {" = "}
                {name}
                {i < judgeNames.length - 1 ? ", " : ""}
              </span>
            ))}
          </>
        )}
      </styled.p>
    </FormControl>
  );
};

const validationSchema = toFormikValidationSchema(tournamentFormSchema);

const Page = () => {
  const { users, tournament } = useLoaderData<typeof loader>();
  const modalRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const body = global.document?.body;
  const params = useParams();

  const onOpen = () => {
    disableBodyScroll(body);
    modalRef.current?.showModal();
  };

  const onClose = () => {
    enableBodyScroll(body);
    modalRef.current?.close();
  };

  const isStartState = tournament.state === TournamentsState.START;
  const canEditDrivers =
    isStartState || tournament.state === TournamentsState.QUALIFYING;

  const fetcher = useFetcher();
  const csvFetcher = useFetcher();
  const inviteFetcher = useFetcher<{ inviteCode: string }>();

  const inviteCode = inviteFetcher.data?.inviteCode ?? tournament.inviteCode;
  const inviteUrl = inviteCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/t/${inviteCode}`
    : null;

  const handleGenerateInviteCode = () => {
    inviteFetcher.submit(null, {
      method: "POST",
      action: `/api/tournaments/${params.id}/invite-code`,
    });
  };

  const handleCopyInviteLink = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      toast.success("Invite link copied to clipboard");
    }
  };

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
      action: `/api/tournaments/${params.id}/import-csv`,
      encType: "multipart/form-data",
    });

    // Reset the input so the same file can be selected again
    event.target.value = "";
  };
  const isSubmitting = fetcher.state !== "idle";

  const formik = useFormik({
    validationSchema,
    enableReinitialize: true,
    initialValues: {
      name: tournament.name ?? "",
      enableQualifying: tournament.enableQualifying ?? false,
      enableBattles: tournament.enableBattles ?? false,
      judges: tournament.judges.map((judge) => ({
        driverId: judge.driverId.toString(),
        points: judge.points,
      })),
      drivers: tournament.drivers.map((driver) => ({
        driverId: driver.driverId.toString(),
      })),
      bracketSize: tournament.bracketSize ?? BracketSize.TOP_4,
      enableProtests: tournament.enableProtests ?? false,
      qualifyingLaps: tournament.qualifyingLaps ?? 1,
      region: tournament.region ?? Regions.UK,
      format: tournament.format ?? TournamentsFormat.STANDARD,
      scoreFormula: tournament.scoreFormula ?? ScoreFormula.AVERAGE,
      qualifyingOrder: tournament.qualifyingOrder ?? QualifyingOrder.DRIVERS,
      driverNumbers: tournament.driverNumbers ?? TournamentsDriverNumbers.NONE,
      ratingRequested: tournament.ratingRequested ?? false,
      judgingInterface: tournament.judgingInterface ?? JudgingInterface.SIMPLE,
    },
    async onSubmit(values) {
      await fetcher.submit(JSON.stringify(values), {
        method: "post",
        encType: "application/json",
      });

      onClose();

      toast.success("Changes saved successfully");
    },
  });

  const SaveButton = () => {
    if (tournament.state === TournamentsState.END) {
      return null;
    }

    return (
      <Button
        type={tournament.state === TournamentsState.START ? "submit" : "button"}
        onClick={
          tournament.state === TournamentsState.START ? undefined : onOpen
        }
        isLoading={isSubmitting}
        disabled={isSubmitting || !formik.isValid || !formik.dirty}
      >
        Save Changes
      </Button>
    );
  };

  return (
    <Flex flexDir="column" gap={4} maxW={600}>
      <form onSubmit={formik.handleSubmit}>
        <Flex overflow="hidden" flexDir="column" gap={4} maxW={600}>
          <Card
            p={6}
            display="flex"
            flexDir="column"
            gap={4}
            overflow="visible"
          >
            <FormControl flex={1} error={formik.errors.name}>
              <Label>Tournament Name</Label>
              <Input
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                placeholder="e.g. 2026 Championship Round 1"
              />
            </FormControl>

            <FormControl flex={1} error={formik.errors.region}>
              <Label>Region</Label>

              <TabGroup>
                {Object.values(Regions).map((item) => {
                  if (item === Regions.ALL) {
                    return null;
                  }

                  return (
                    <TabButton
                      type="button"
                      key={item}
                      isActive={formik.values.region === item}
                      onClick={() => formik.setFieldValue("region", item)}
                    >
                      {item}
                    </TabButton>
                  );
                })}
              </TabGroup>
            </FormControl>

            <FormControl flex={1} error={formik.errors.ratingRequested}>
              <Label>Is this a rated tournament?</Label>
              <TabGroup>
                <TabButton
                  type="button"
                  isActive={formik.values.ratingRequested}
                  onClick={() => formik.setFieldValue("ratingRequested", true)}
                >
                  Yes
                </TabButton>
                <TabButton
                  type="button"
                  isActive={!formik.values.ratingRequested}
                  onClick={() => formik.setFieldValue("ratingRequested", false)}
                >
                  No
                </TabButton>
              </TabGroup>
            </FormControl>

            <FormControl flex={1} error={formik.errors.region}>
              <Label>Driver Identification Numbers (DIN)</Label>

              <TabGroup>
                {Object.values(TournamentsDriverNumbers).map((item) => {
                  return (
                    <TabButton
                      type="button"
                      key={item}
                      isActive={formik.values.driverNumbers === item}
                      onClick={() =>
                        formik.setFieldValue("driverNumbers", item)
                      }
                    >
                      {capitalCase(item)}
                    </TabButton>
                  );
                })}
              </TabGroup>
            </FormControl>

            <FormControl flex={1} error={formik.errors.judges}>
              <Label>Tournament Judges</Label>
              {!isStartState && (
                <styled.p fontSize="sm" color="brand.500" mb={2}>
                  Judges cannot be changed after the tournament has started.
                </styled.p>
              )}

              <PeopleForm
                users={users}
                value={formik.values.judges}
                onChange={(value) => formik.setFieldValue("judges", value)}
                name="judges"
                allowPoints
                disabled={!isStartState}
              />
            </FormControl>

            <SaveButton />
          </Card>

          <Card overflow="visible">
            <CardHeader gap={4}>
              <Icon>
                <RiLink />
              </Icon>
              <styled.h2 fontWeight="medium" fontSize="lg">
                Invite Link
              </styled.h2>
              <Spacer />
              {inviteCode && (
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={handleCopyInviteLink}
                >
                  Copy Link
                  <RiClipboardLine />
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={handleGenerateInviteCode}
                isLoading={inviteFetcher.state !== "idle"}
                disabled={inviteFetcher.state !== "idle"}
              >
                {inviteCode ? "Regenerate" : "Generate"}
                <RiRefreshLine />
              </Button>
            </CardHeader>

            <CardContent p={4} display="flex" flexDir="column" gap={2}>
              <styled.p color="gray.400" fontSize="sm">
                Share this link with drivers to let them join the tournament.
              </styled.p>
              {inviteUrl ? (
                <Box
                  p={3}
                  rounded="lg"
                  bgColor="gray.800"
                  borderWidth={1}
                  borderColor="gray.700"
                  fontFamily="mono"
                  fontSize="sm"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                >
                  {inviteUrl}
                </Box>
              ) : (
                <styled.p color="gray.500" fontSize="sm">
                  No invite link generated yet. Click "Generate" to create one.
                </styled.p>
              )}
            </CardContent>
          </Card>

          <Card overflow="visible">
            <CardHeader gap={4}>
              <Icon>
                <RiUser3Line />
              </Icon>
              <styled.h2 fontWeight="medium" fontSize="lg">
                Drivers
              </styled.h2>
              <Spacer />
            </CardHeader>

            <CardContent p={4} display="flex" flexDir="column" gap={4}>
              {canEditDrivers && (
                <Flex gap={2} mb={2}>
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() =>
                      formik.setFieldValue(
                        "drivers",
                        [...formik.values.drivers].sort(
                          () => Math.random() - 0.5,
                        ),
                      )
                    }
                  >
                    Shuffle
                    <RiShuffleLine />
                  </Button>
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
              )}

              <FormControl error={formik.errors.drivers}>
                {!canEditDrivers && (
                  <styled.p fontSize="sm" color="brand.500" mb={2}>
                    Drivers cannot be changed during battles.
                  </styled.p>
                )}
                <PeopleForm
                  users={users}
                  value={formik.values.drivers}
                  onChange={(value) => formik.setFieldValue("drivers", value)}
                  name="drivers"
                  allowNewDrivers
                  disabled={!canEditDrivers}
                />
              </FormControl>

              <SaveButton />
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              onClick={() =>
                isStartState && formik.setFieldValue("enableQualifying", true)
              }
              gap={4}
            >
              <Icon>
                <RiShieldCheckLine />
              </Icon>

              <styled.h2 fontSize="lg" fontWeight="semibold">
                Qualifying
              </styled.h2>

              <Spacer />

              {isStartState && (
                <TabGroup>
                  <TabButton
                    isActive={!formik.values.enableQualifying}
                    onClick={(e) => {
                      e.stopPropagation();
                      formik.setFieldValue("enableQualifying", false);
                    }}
                    type="button"
                  >
                    Disable
                  </TabButton>
                  <TabButton
                    isActive={formik.values.enableQualifying}
                    onClick={(e) => {
                      e.stopPropagation();
                      formik.setFieldValue("enableQualifying", true);
                    }}
                    type="button"
                  >
                    Enable
                  </TabButton>
                </TabGroup>
              )}
            </CardHeader>

            {formik.values.enableQualifying && (
              <CardContent display="flex" flexDir="column" gap={4}>
                <FormControl flex={1} error={formik.errors.qualifyingLaps}>
                  <Label>How many qualifying runs per driver?</Label>
                  {!isStartState && (
                    <styled.p fontSize="sm" color="brand.500" mb={2}>
                      Qualifying laps cannot be changed after the tournament has
                      started.
                    </styled.p>
                  )}
                  <TabGroup>
                    <TabButton
                      isActive={formik.values.qualifyingLaps === 1}
                      disabled={!isStartState}
                      onClick={() => formik.setFieldValue("qualifyingLaps", 1)}
                      type="button"
                    >
                      1
                    </TabButton>
                    <TabButton
                      isActive={formik.values.qualifyingLaps === 2}
                      disabled={!isStartState}
                      onClick={() => formik.setFieldValue("qualifyingLaps", 2)}
                      type="button"
                    >
                      2
                    </TabButton>
                    <TabButton
                      isActive={formik.values.qualifyingLaps === 3}
                      disabled={!isStartState}
                      onClick={() => formik.setFieldValue("qualifyingLaps", 3)}
                      type="button"
                    >
                      3
                    </TabButton>
                  </TabGroup>
                </FormControl>

                <FormControl flex={1} error={formik.errors.qualifyingOrder}>
                  <Label>How should the qualifying order be run?</Label>
                  <TabGroup>
                    {Object.values(QualifyingOrder).map((item) => {
                      return (
                        <TabButton
                          key={item}
                          type="button"
                          isActive={formik.values.qualifyingOrder === item}
                          onClick={() =>
                            formik.setFieldValue("qualifyingOrder", item)
                          }
                        >
                          Group by {capitalCase(item)}
                        </TabButton>
                      );
                    })}
                  </TabGroup>
                </FormControl>

                <ScoreFormulaSelect
                  judgeCount={formik.values.judges.length}
                  users={users}
                  judgeIds={formik.values.judges.map((j) => j.driverId)}
                  value={formik.values.scoreFormula}
                  onChange={(value) =>
                    formik.setFieldValue("scoreFormula", value)
                  }
                  error={formik.errors.scoreFormula}
                />

                <SaveButton />
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader
              onClick={() =>
                isStartState && formik.setFieldValue("enableBattles", true)
              }
              gap={4}
            >
              <Icon>
                <RiSwordLine />
              </Icon>

              <styled.h2 fontSize="lg" fontWeight="semibold">
                Battles
              </styled.h2>

              <Spacer />

              {isStartState && (
                <TabGroup>
                  <TabButton
                    isActive={!formik.values.enableBattles}
                    onClick={(e) => {
                      e.stopPropagation();
                      formik.setFieldValue("enableBattles", false);
                    }}
                    type="button"
                  >
                    Disable
                  </TabButton>
                  <TabButton
                    isActive={formik.values.enableBattles}
                    onClick={(e) => {
                      e.stopPropagation();
                      formik.setFieldValue("enableBattles", true);
                    }}
                    type="button"
                  >
                    Enable
                  </TabButton>
                </TabGroup>
              )}
            </CardHeader>

            {formik.values.enableBattles && (
              <CardContent display="flex" flexDir="column" gap={4}>
                <FormControl flex={1} error={formik.errors.format}>
                  <Label>Battle Format</Label>
                  <TabGroup>
                    {Object.values(TournamentsFormat).map((item) => {
                      return (
                        <TabButton
                          key={item}
                          type="button"
                          isActive={formik.values.format === item}
                          onClick={() => formik.setFieldValue("format", item)}
                        >
                          {capitalCase(item)}
                        </TabButton>
                      );
                    })}
                  </TabGroup>
                </FormControl>

                <FormControl flex={1} error={formik.errors.bracketSize}>
                  <Label>Bracket Size</Label>
                  <Flex gap={2} flexWrap="wrap">
                    {Object.values(BracketSize).map((item) => {
                      return (
                        <TabButton
                          type="button"
                          key={item}
                          isActive={formik.values.bracketSize === item}
                          onClick={() =>
                            formik.setFieldValue("bracketSize", item)
                          }
                        >
                          Top {item}
                        </TabButton>
                      );
                    })}
                  </Flex>
                </FormControl>

                <FormControl flex={1} error={formik.errors.enableProtests}>
                  <Label>Enable Protesting</Label>

                  <TabGroup>
                    <TabButton
                      type="button"
                      isActive={!formik.values.enableProtests}
                      onClick={() =>
                        formik.setFieldValue("enableProtests", false)
                      }
                    >
                      No
                    </TabButton>
                    <TabButton
                      type="button"
                      isActive={formik.values.enableProtests}
                      onClick={() =>
                        formik.setFieldValue("enableProtests", true)
                      }
                    >
                      Yes
                    </TabButton>
                  </TabGroup>
                </FormControl>

                <FormControl flex={1} error={formik.errors.judgingInterface}>
                  <Label>Judging Interface</Label>

                  <TabGroup>
                    <TabButton
                      type="button"
                      isActive={
                        formik.values.judgingInterface ===
                        JudgingInterface.SIMPLE
                      }
                      onClick={() =>
                        formik.setFieldValue(
                          "judgingInterface",
                          JudgingInterface.SIMPLE,
                        )
                      }
                    >
                      Simple
                    </TabButton>
                    <TabButton
                      type="button"
                      isActive={
                        formik.values.judgingInterface ===
                        JudgingInterface.ADVANCED
                      }
                      onClick={() =>
                        formik.setFieldValue(
                          "judgingInterface",
                          JudgingInterface.ADVANCED,
                        )
                      }
                    >
                      Advanced
                    </TabButton>
                  </TabGroup>
                </FormControl>

                <SaveButton />
              </CardContent>
            )}
          </Card>
        </Flex>

        <styled.dialog
          ref={modalRef}
          role="dialog"
          m="auto"
          bgColor="gray.950"
          color="white"
          p={1}
          rounded="3xl"
          borderWidth={1}
          borderColor="gray.800"
          textAlign="center"
          _backdrop={{
            bg: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Box
            bgColor="gray.900"
            p={6}
            borderWidth={1}
            borderColor="gray.800"
            rounded="2xl"
          >
            <styled.h1
              mb={2}
              fontWeight="medium"
              fontSize="2xl"
              lineHeight="1.2"
            >
              Are you sure you want to save these changes?
            </styled.h1>

            <styled.p
              color="brand.500"
              fontWeight="medium"
              mb={2}
              whiteSpace="pre-line"
            >
              This may result in some or all of the tournament progress being
              reset.
            </styled.p>

            <Flex
              gap={2}
              justifyContent="center"
              mt={6}
              flexDir={{ base: "column", sm: "row" }}
            >
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={isSubmitting || !formik.isValid || !formik.dirty}
              >
                Save Changes
              </Button>
            </Flex>
          </Box>
        </styled.dialog>
      </form>
    </Flex>
  );
};

export default Page;
