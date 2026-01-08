import { capitalCase } from "change-case";
import { useFormik } from "formik";
import { useEffect, useRef } from "react";
import {
  RiFileUploadLine,
  RiShieldCheckLine,
  RiShuffleLine,
  RiSwordLine,
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
import { DashedLine } from "~/components/DashedLine";
import { FormControl } from "~/components/FormControl";
import { Input } from "~/components/Input";
import { Label } from "~/components/Label";
import { TabButton, TabGroup } from "~/components/Tab";
import { PeopleForm } from "~/components/PeopleForm";
import { Box, Flex, Spacer, styled } from "~/styled-system/jsx";
import {
  BracketSize,
  TournamentsDriverNumbers,
  QualifyingOrder,
  Regions,
  ScoreFormula,
  TournamentsFormat,
} from "~/utils/enums";
import { getAuth } from "~/utils/getAuth.server";
import { getUsers } from "~/utils/getUsers.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";
import { Spinner } from "~/components/Spinner";

export const tournamentFormSchema = z.object({
  name: z.string().min(1, "Tournament name is required"),
  enableQualifying: z.boolean(),
  enableBattles: z.boolean(),
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
      drivers: true,
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

  await prisma.laps.deleteMany({
    where: {
      tournamentDriverId: {
        in: tournament.drivers.map((driver) => driver.id),
      },
    },
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

  // Create qualifying laps
  let nextQualifyingLapId: number | null = null;

  if (tournament.enableQualifying) {
    const [nextQualifyingLap] = await prisma.laps.createManyAndReturn({
      data: Array.from({ length: tournament.qualifyingLaps }).flatMap(
        (_, i) => {
          return tournament.drivers.map((driver) => {
            return {
              tournamentDriverId: driver.id,
              round: i + 1,
            };
          });
        },
      ),
    });

    nextQualifyingLapId = nextQualifyingLap?.id ?? null;

    await prisma.tournaments.update({
      where: {
        id,
      },
      data: {
        nextQualifyingLapId,
      },
    });
  }

  return null;
};

const Icon = styled("div", {
  base: {
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

const validationSchema = toFormikValidationSchema(tournamentFormSchema);

const Page = () => {
  const { users, tournament } = useLoaderData<typeof loader>();

  const fetcher = useFetcher();
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
      scoreFormula: tournament.scoreFormula ?? ScoreFormula.CUMULATIVE,
      qualifyingOrder: tournament.qualifyingOrder ?? QualifyingOrder.DRIVERS,
      driverNumbers: tournament.driverNumbers ?? TournamentsDriverNumbers.NONE,
      ratingRequested: tournament.ratingRequested ?? false,
    },
    onSubmit: (values) => {
      fetcher.submit(JSON.stringify(values), {
        method: "post",
        encType: "application/json",
      });
    },
  });

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    formik.submitForm();
  }, [formik.values]);

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
              <Label>Who are the tournament judges?</Label>

              <PeopleForm
                users={users}
                value={formik.values.judges}
                onChange={(value) => formik.setFieldValue("judges", value)}
                name="judges"
                allowPoints
              />
            </FormControl>
          </Card>

          <Card overflow="visible">
            <CardHeader>
              <styled.h2 fontWeight="medium" fontSize="lg">
                Drivers
              </styled.h2>
              <Spacer />
              {isSubmitting && <Spinner />}
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() =>
                  formik.setFieldValue(
                    "drivers",
                    [...formik.values.drivers].sort(() => Math.random() - 0.5),
                  )
                }
              >
                Shuffle
                <RiShuffleLine />
              </Button>
              <Button variant="outline" size="sm" type="button">
                Import CSV <RiFileUploadLine />
              </Button>
            </CardHeader>

            <CardContent p={4}>
              <PeopleForm
                users={users}
                value={formik.values.drivers}
                onChange={(value) => formik.setFieldValue("drivers", value)}
                name="drivers"
                allowNewDrivers
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              onClick={() => formik.setFieldValue("enableQualifying", true)}
              gap={4}
            >
              <Icon>
                <RiShieldCheckLine />
              </Icon>

              <styled.h2 fontSize="lg" fontWeight="semibold">
                Qualifying
              </styled.h2>

              <Spacer />

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
            </CardHeader>

            {formik.values.enableQualifying && (
              <CardContent display="flex" flexDir="column" gap={4}>
                <FormControl flex={1} error={formik.errors.qualifyingLaps}>
                  <Label>How many qualifying laps?</Label>
                  <TabGroup>
                    <TabButton
                      isActive={formik.values.qualifyingLaps === 1}
                      onClick={() => formik.setFieldValue("qualifyingLaps", 1)}
                      type="button"
                    >
                      1
                    </TabButton>
                    <TabButton
                      isActive={formik.values.qualifyingLaps === 2}
                      onClick={() => formik.setFieldValue("qualifyingLaps", 2)}
                      type="button"
                    >
                      2
                    </TabButton>
                    <TabButton
                      isActive={formik.values.qualifyingLaps === 3}
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

                <FormControl flex={1} error={formik.errors.scoreFormula}>
                  <Label>What score formula should be used?</Label>
                  <TabGroup>
                    {Object.values(ScoreFormula).map((item) => {
                      return (
                        <TabButton
                          key={item}
                          type="button"
                          isActive={formik.values.scoreFormula === item}
                          onClick={() =>
                            formik.setFieldValue("scoreFormula", item)
                          }
                        >
                          {capitalCase(item)}
                        </TabButton>
                      );
                    })}
                  </TabGroup>
                </FormControl>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader
              onClick={() => formik.setFieldValue("enableBattles", true)}
              gap={4}
            >
              <Icon>
                <RiSwordLine />
              </Icon>

              <styled.h2 fontSize="lg" fontWeight="semibold">
                Battles
              </styled.h2>

              <Spacer />

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
            </CardHeader>

            {formik.values.enableBattles && (
              <CardContent display="flex" flexDir="column" gap={4}>
                <FormControl flex={1} error={formik.errors.format}>
                  <Label>What format is this tournament?</Label>
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
                  <Label>What size bracket do you want to use?</Label>
                  <TabGroup>
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
                  </TabGroup>
                </FormControl>

                <FormControl flex={1} error={formik.errors.enableProtests}>
                  <Label>Enable protesting?</Label>

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
              </CardContent>
            )}
          </Card>
        </Flex>
      </form>
    </Flex>
  );
};

export default Page;
