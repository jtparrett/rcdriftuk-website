import { useFetcher, useSearchParams } from "react-router";
import { styled, Box, Flex } from "~/styled-system/jsx";
import type { GetTournament } from "~/utils/getTournament.server";
import { Input } from "./Input";
import { Button } from "./Button";
import {
  Regions,
  TournamentsFormat,
  ScoreFormula,
  QualifyingOrder,
  QualifyingProcedure,
} from "~/utils/enums";
import { capitalCase } from "change-case";
import type { GetUsers } from "~/utils/getUsers.server";
import { useMemo, useState } from "react";
import { RiDeleteBinFill, RiDraggable, RiShuffleLine } from "react-icons/ri";
import { StepDot } from "./StepDot";
import { Dropdown, Option } from "./Dropdown";
import { TabButton, TabGroup } from "./Tab";
import { Reorder } from "motion/react";
import { TOURNAMENT_TEMPLATES } from "~/utils/tournamentTemplates";
import { useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { tournamentFormSchema } from "~/routes/api.tournaments.$id.start";
import { Label } from "./Label";
import { FormControl } from "./FormControl";

interface Props {
  tournament: GetTournament;
  users: GetUsers;
  eventDrivers: number[];
}

interface PeopleFormProps {
  users: GetUsers;
  name: string;
  allowNewDrivers?: boolean;
  allowRandomise?: boolean;
  allowPoints?: boolean;
  onChange: (value: { driverId: string; points?: number }[]) => void;
  value: { driverId: string; points?: number }[];
}

const PeopleForm = ({
  users,
  value,
  onChange,
  name,
  allowNewDrivers = false,
  allowRandomise = false,
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
      {allowRandomise && (
        <Button
          variant="outline"
          size="sm"
          mb={2}
          type="button"
          onClick={() => {
            onChange([...value].sort(() => Math.random() - 0.5));
          }}
        >
          <RiShuffleLine /> Shuffle Order
        </Button>
      )}

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
                      {user
                        ? `${user.firstName} ${user.lastName}`
                        : person.driverId}
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
            }, 0);
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
                  {user.firstName} {user.lastName}
                </Option>
              );
            })}

            {allowNewDrivers &&
              search.trim().split(" ").length >= 2 &&
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

export const TournamentStartForm = ({
  tournament,
  users,
  eventDrivers,
}: Props) => {
  const fetcher = useFetcher();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("template");
  const template =
    templateId && templateId in TOURNAMENT_TEMPLATES
      ? TOURNAMENT_TEMPLATES[templateId]
      : null;

  const formik = useFormik({
    validationSchema,
    enableReinitialize: true,
    initialValues: {
      judges:
        tournament?.judges.map((judge) => ({
          driverId: judge.driverId.toString(),
          points: judge.points,
        })) ?? [],
      drivers: Array.from(
        Array.from(
          new Set([
            ...eventDrivers.map((driver) => driver.toString()),
            ...(tournament?.drivers.map((driver) =>
              driver.driverId.toString(),
            ) ?? []),
          ]),
        ).map((driver) => ({
          driverId: driver,
        })),
      ),
      fullInclusion: false,
      enableProtests: false,
      qualifyingLaps: tournament?.qualifyingLaps ?? 1,
      region: template?.region ?? tournament?.region ?? Regions.UK,
      format:
        template?.format ?? tournament?.format ?? TournamentsFormat.STANDARD,
      scoreFormula:
        template?.scoreFormula ??
        tournament?.scoreFormula ??
        ScoreFormula.CUMULATIVE,
      qualifyingOrder:
        template?.qualifyingOrder ??
        tournament?.qualifyingOrder ??
        QualifyingOrder.DRIVERS,
      qualifyingProcedure:
        template?.qualifyingProcedure ??
        tournament?.qualifyingProcedure ??
        QualifyingProcedure.BEST,
    },
    onSubmit: (values) => {
      fetcher.submit(JSON.stringify(values), {
        method: "post",
        action: `/api/tournaments/${tournament?.id}/start`,
        encType: "application/json",
      });
    },
  });

  const { format } = formik.values;

  return (
    <form onSubmit={formik.handleSubmit}>
      <Flex overflow="hidden" flexDir="column" gap={8} maxW={600}>
        <Flex gap={4} pt={8}>
          <StepDot />
          <FormControl flex={1} error={formik.errors.format}>
            <Label>What format is this tournament?</Label>
            <Flex gap={0.5} flexWrap="wrap">
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
            </Flex>
          </FormControl>
        </Flex>

        {(format === TournamentsFormat.STANDARD ||
          format === TournamentsFormat.DOUBLE_ELIMINATION ||
          format === TournamentsFormat.WILDCARD) && (
          <>
            <Flex gap={4}>
              <StepDot />
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
            </Flex>

            <Flex gap={4}>
              <StepDot />
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
            </Flex>

            <Flex gap={4}>
              <StepDot />
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
            </Flex>

            <Flex gap={4}>
              <StepDot />
              <FormControl flex={1} error={formik.errors.scoreFormula}>
                <Label>What qualifying procedure should be used?</Label>
                <TabGroup>
                  {Object.values(QualifyingProcedure).map((item) => {
                    return (
                      <TabButton
                        key={item}
                        type="button"
                        isActive={formik.values.qualifyingProcedure === item}
                        onClick={() =>
                          formik.setFieldValue("qualifyingProcedure", item)
                        }
                      >
                        {capitalCase(item)}
                      </TabButton>
                    );
                  })}
                </TabGroup>
              </FormControl>
            </Flex>
          </>
        )}

        <Flex gap={4}>
          <StepDot />
          <FormControl flex={1} error={formik.errors.enableProtests}>
            <Label>Enable protesting?</Label>

            <TabGroup>
              <TabButton
                type="button"
                isActive={!formik.values.enableProtests}
                onClick={() => formik.setFieldValue("enableProtests", false)}
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
        </Flex>

        {(format === TournamentsFormat.STANDARD ||
          format === TournamentsFormat.DOUBLE_ELIMINATION ||
          format === TournamentsFormat.WILDCARD ||
          format === TournamentsFormat.BATTLE_TREE) && (
          <Flex gap={4}>
            <StepDot />
            <FormControl flex={1} error={formik.errors.fullInclusion}>
              <Label>Should all drivers participate in battles?</Label>
              <styled.span
                mb={2}
                color="gray.500"
                display="block"
                textWrap="pretty"
              >
                Enabling this option will ensure the bracket is fully populated,
                granting Bye-runs to the highest-qualified drivers where
                necessary.
              </styled.span>

              <TabGroup>
                <TabButton
                  type="button"
                  isActive={!formik.values.fullInclusion}
                  onClick={() => formik.setFieldValue("fullInclusion", false)}
                >
                  No
                </TabButton>
                <TabButton
                  type="button"
                  isActive={formik.values.fullInclusion}
                  onClick={() => formik.setFieldValue("fullInclusion", true)}
                >
                  Yes
                </TabButton>
              </TabGroup>
            </FormControl>
          </Flex>
        )}

        <Flex gap={4}>
          <StepDot />
          <FormControl flex={1} error={formik.errors.region}>
            <Label>Which region is this tournament in?</Label>

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
        </Flex>

        <Flex gap={4}>
          <StepDot />
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
        </Flex>

        <Flex gap={4}>
          <StepDot />
          <FormControl flex={1} error={formik.errors.drivers}>
            <Label>Who are the tournament drivers?</Label>

            <PeopleForm
              allowNewDrivers
              allowRandomise
              users={users}
              value={formik.values.drivers}
              onChange={(value) => formik.setFieldValue("drivers", value)}
              name="drivers"
            />
          </FormControl>
        </Flex>

        <Flex gap={4}>
          <StepDot />
          <FormControl flex={1} pb={24}>
            <Label>Are you ready to start this tournament?</Label>
            <Button
              type="submit"
              isLoading={fetcher.state === "submitting"}
              disabled={fetcher.state === "submitting"}
            >
              I'm ready, let's go!
            </Button>
          </FormControl>
        </Flex>
      </Flex>
    </form>
  );
};
