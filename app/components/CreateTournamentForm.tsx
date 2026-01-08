import { useFetcher } from "react-router";
import { styled, Box, Flex, Spacer } from "~/styled-system/jsx";
import { Input } from "./Input";
import { Button } from "./Button";
import {
  Regions,
  TournamentsFormat,
  ScoreFormula,
  QualifyingOrder,
  TournamentsDriverNumbers,
  BracketSize,
} from "~/utils/enums";
import { capitalCase } from "change-case";
import type { GetUsers } from "~/utils/getUsers.server";
import { useMemo, useState } from "react";
import {
  RiDeleteBinFill,
  RiDraggable,
  RiShuffleLine,
  RiVipCrown2Line,
} from "react-icons/ri";
import { Dropdown, Option } from "./Dropdown";
import { TabButton, TabGroup } from "./Tab";
import { Reorder } from "motion/react";
import { useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { Label } from "./Label";
import { FormControl } from "./FormControl";
import pluralize from "pluralize";
import { z } from "zod";
import { Card, CardContent, CardHeader } from "./CollapsibleCard";

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

interface PeopleFormProps {
  users: GetUsers;
  name: string;
  allowNewDrivers?: boolean;
  allowPoints?: boolean;
  onChange: (value: { driverId: string; points?: number }[]) => void;
  value: { driverId: string; points?: number }[];
}

export const PeopleForm = ({
  users,
  value,
  onChange,
  name,
  allowNewDrivers = false,
  allowPoints = false,
}: PeopleFormProps) => {
  const [focused, setFocused] = useState(false);
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        !value.some((v) => v.driverId === user.driverId.toString()) &&
        `${user.firstName} ${user.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  }, [users, value, search]);

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
            {value.map((person, i) => {
              const user = users.find(
                (user) => user.driverId.toString() === person.driverId,
              );

              return (
                <Reorder.Item
                  key={person.driverId}
                  value={person}
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
                      {user ? (
                        <>
                          {user.firstName} {user.lastName}{" "}
                          <styled.span
                            color="gray.500"
                            fontSize="sm"
                            verticalAlign="middle"
                          >
                            #{person.driverId}
                          </styled.span>
                        </>
                      ) : (
                        <>
                          {person.driverId}{" "}
                          <styled.span
                            color="gray.500"
                            fontSize="sm"
                            verticalAlign="middle"
                          >
                            (new)
                          </styled.span>
                        </>
                      )}
                    </styled.p>

                    {allowPoints && (
                      <styled.select
                        name={name + "Points"}
                        fontSize="sm"
                        borderWidth={1}
                        borderColor="gray.800"
                        rounded="sm"
                        fontFamily="mono"
                        value={person.points}
                        onChange={(e) => {
                          onChange(
                            value.map((p, index) =>
                              index === i
                                ? {
                                    ...p,
                                    points: Number(e.target.value),
                                  }
                                : p,
                            ),
                          );
                        }}
                      >
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(
                          (points) => (
                            <option key={points} value={points * 10}>
                              {points * 10}
                            </option>
                          ),
                        )}
                      </styled.select>
                    )}

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

          <Box px={2} py={1}>
            <styled.p textAlign="right" fontSize="sm" color="gray.500">
              {pluralize("People", value.length, true)}
            </styled.p>
          </Box>
        </Box>
      )}

      <Box pos="relative">
        <Input
          placeholder="Type to search for people..."
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
            {filteredUsers.map((user) => {
              return (
                <Option
                  key={user.driverId}
                  type="button"
                  onClick={() => {
                    onChange([
                      ...value,
                      {
                        driverId: user.driverId.toString(),
                        points: 100,
                      },
                    ]);
                    setSearch("");
                  }}
                >
                  {user.firstName} {user.lastName} (#{user.driverId})
                </Option>
              );
            })}

            {!allowNewDrivers && filteredUsers.length === 0 && (
              <styled.p px={2} py={1} fontWeight="semibold">
                No results found
              </styled.p>
            )}

            {allowNewDrivers &&
              filteredUsers.length === 0 &&
              search
                .trim()
                .split(" ")
                .every((part) => part.length > 0) && (
                <Option
                  type="button"
                  onClick={() => {
                    onChange([
                      ...value,
                      {
                        driverId: search.trim(),
                        points: 100,
                      },
                    ]);
                    setSearch("");
                  }}
                >
                  Create "{search.trim()}" as a new driver
                </Option>
              )}
          </Dropdown>
        )}
      </Box>
    </Box>
  );
};

const validationSchema = toFormikValidationSchema(tournamentFormSchema);

interface Props {
  users: GetUsers;
  initialValues: Partial<z.infer<typeof tournamentFormSchema>>;
}

export const CreateTournamentForm = ({ users, initialValues }: Props) => {
  const fetcher = useFetcher();

  const formik = useFormik({
    validationSchema,
    enableReinitialize: true,
    initialValues: {
      name: initialValues.name ?? "",
      enableQualifying: initialValues.enableQualifying ?? false,
      enableBattles: initialValues.enableBattles ?? false,
      judges: initialValues.judges ?? [],
      bracketSize: initialValues.bracketSize ?? BracketSize.TOP_4,
      enableProtests: initialValues.enableProtests ?? false,
      qualifyingLaps: initialValues.qualifyingLaps ?? 1,
      region: initialValues.region ?? Regions.UK,
      format: initialValues.format ?? TournamentsFormat.STANDARD,
      scoreFormula: initialValues.scoreFormula ?? ScoreFormula.CUMULATIVE,
      qualifyingOrder: initialValues.qualifyingOrder ?? QualifyingOrder.DRIVERS,
      driverNumbers:
        initialValues.driverNumbers ?? TournamentsDriverNumbers.NONE,
      ratingRequested: initialValues.ratingRequested ?? false,
    },
    onSubmit: (values) => {
      fetcher.submit(JSON.stringify(values), {
        method: "post",
        encType: "application/json",
      });
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <Flex overflow="hidden" flexDir="column" gap={4} maxW={600}>
        <Card p={6} display="flex" flexDir="column" gap={4} overflow="visible">
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
                    onClick={() => formik.setFieldValue("driverNumbers", item)}
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

        <Card>
          <CardHeader
            onClick={() => formik.setFieldValue("enableQualifying", true)}
          >
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
          >
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
                    onClick={() => formik.setFieldValue("enableProtests", true)}
                  >
                    Yes
                  </TabButton>
                </TabGroup>
              </FormControl>
            </CardContent>
          )}
        </Card>

        <FormControl>
          <Button
            type="submit"
            isLoading={fetcher.state === "submitting"}
            disabled={fetcher.state === "submitting" || !formik.isValid}
            w="full"
          >
            Start Registration <RiVipCrown2Line />
          </Button>
        </FormControl>
      </Flex>
    </form>
  );
};
