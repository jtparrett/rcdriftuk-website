import { Form, useSearchParams } from "react-router";
import { styled, Box, Flex } from "~/styled-system/jsx";
import type { GetTournament } from "~/utils/getTournament.server";
import { Input } from "./Input";
import { Button } from "./Button";
import { Regions, TournamentsFormat, ScoreFormula } from "~/utils/enums";
import { capitalCase } from "change-case";
import type { GetUsers } from "~/utils/getUsers.server";
import { useMemo, useState } from "react";
import { RiDeleteBinFill, RiDraggable, RiShuffleLine } from "react-icons/ri";
import { StepDot } from "./StepDot";
import { Dropdown, Option } from "./Dropdown";
import { TabButton, TabGroup } from "./Tab";
import { Reorder } from "motion/react";
import { TOURNAMENT_TEMPLATES } from "~/utils/tournamentTemplates";

interface Props {
  tournament: GetTournament;
  users: GetUsers;
  eventDrivers: number[];
}

const PersonPointsInput = ({ name }: { name: string }) => {
  const [points, setPoints] = useState(100);
  return (
    <styled.select
      name={name + "Points"}
      value={points}
      onChange={(e) => setPoints(Number(e.target.value))}
      fontSize="sm"
      borderWidth={1}
      borderColor="gray.800"
      rounded="sm"
      fontFamily="mono"
    >
      {Array.from({ length: 10 }, (_, i) => i + 1).map((points) => (
        <option key={points} value={points * 10}>
          {points * 10}
        </option>
      ))}
    </styled.select>
  );
};

const PeopleForm = ({
  users,
  defaultValue,
  name,
  allowNewDrivers = false,
  allowRandomize = false,
  allowPoints = false,
}: {
  users: GetUsers;
  defaultValue: number[];
  name: string;
  allowNewDrivers?: boolean;
  allowRandomize?: boolean;
  allowPoints?: boolean;
}) => {
  const [value, onChange] = useState<(number | string)[]>(defaultValue);
  const [focused, setFocused] = useState(false);
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        !value.includes(user.driverId) &&
        `${user.firstName} ${user.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  }, [users, value, search]);

  return (
    <Box>
      {allowRandomize && (
        <Button
          variant="outline"
          size="sm"
          mb={2}
          type="button"
          onClick={() => {
            onChange([...value].sort(() => Math.random() - 0.5));
          }}
        >
          <RiShuffleLine /> Randomize Order
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
            {value.map((userId, i) => {
              const user = users.find((user) =>
                typeof userId === "string" ? false : user.driverId === userId,
              );

              return (
                <Reorder.Item
                  key={userId}
                  value={userId}
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
                    <input type="hidden" name={name} value={userId} />

                    <RiDraggable size={16} />

                    <styled.p
                      flex={1}
                      userSelect="none"
                      whiteSpace="nowrap"
                      textOverflow="ellipsis"
                      overflow="hidden"
                      py={1}
                    >
                      {user ? `${user.firstName} ${user.lastName}` : userId}
                    </styled.p>

                    {allowPoints && <PersonPointsInput name={name} />}

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
                    onChange([...value, user.driverId]);
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
                    onChange([...value, search.trim()]);
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

export const TournamentStartForm = ({
  tournament,
  users,
  eventDrivers,
}: Props) => {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("template");
  const template =
    templateId && templateId in TOURNAMENT_TEMPLATES
      ? TOURNAMENT_TEMPLATES[templateId]
      : null;
  const [fullInclusion, setFullInclusion] = useState(false);
  const [region, setRegion] = useState<Regions>(
    template?.region ?? tournament?.region ?? Regions.UK,
  );
  const [format, setFormat] = useState(
    template?.format ?? tournament?.format ?? TournamentsFormat.STANDARD,
  );
  const [scoreFormula, setScoreFormula] = useState<ScoreFormula>(
    template?.scoreFormula ??
      tournament?.scoreFormula ??
      ScoreFormula.CUMULATIVE,
  );

  return (
    <Form method="post" action={`/api/tournaments/${tournament?.id}/start`}>
      <Flex overflow="hidden" flexDir="column" gap={8} maxW={600}>
        <Flex gap={4} pt={8}>
          <StepDot />
          <Box flex={1}>
            <styled.label mb={2} display="block">
              What format is this tournament?
            </styled.label>
            <input type="hidden" name="format" value={format} />
            <TabGroup>
              {Object.values(TournamentsFormat).map((item) => {
                return (
                  <TabButton
                    key={item}
                    type="button"
                    isActive={format === item}
                    onClick={() => setFormat(item)}
                  >
                    {capitalCase(item)}
                  </TabButton>
                );
              })}
            </TabGroup>
          </Box>
        </Flex>

        {(format === TournamentsFormat.STANDARD ||
          format === TournamentsFormat.DOUBLE_ELIMINATION) && (
          <Flex gap={4}>
            <StepDot />
            <Box flex={1}>
              <styled.label mb={2} display="block">
                How many qualifying laps?
              </styled.label>
              <Input
                maxW={100}
                type="number"
                name="qualifyingLaps"
                min={1}
                defaultValue={tournament?.qualifyingLaps}
              />
            </Box>
          </Flex>
        )}

        {(format === TournamentsFormat.STANDARD ||
          format === TournamentsFormat.DOUBLE_ELIMINATION) && (
          <Flex gap={4}>
            <StepDot />
            <Box flex={1}>
              <styled.label mb={2} display="block">
                What score formula should be used?
              </styled.label>
              <input type="hidden" name="scoreFormula" value={scoreFormula} />
              <TabGroup>
                {Object.values(ScoreFormula).map((item) => {
                  return (
                    <TabButton
                      key={item}
                      type="button"
                      isActive={scoreFormula === item}
                      onClick={() => setScoreFormula(item)}
                    >
                      {capitalCase(item)}
                    </TabButton>
                  );
                })}
              </TabGroup>
            </Box>
          </Flex>
        )}

        <Flex gap={4}>
          <StepDot />
          <Box flex={1}>
            <styled.label mb={2} display="block">
              Who are the tournament judges?
            </styled.label>

            <PeopleForm
              users={users}
              defaultValue={
                tournament?.judges.map((judge) => judge.driverId) ?? []
              }
              name="judges"
              allowPoints
            />
          </Box>
        </Flex>

        <Flex gap={4}>
          <StepDot />
          <Box flex={1}>
            <styled.label mb={2} display="block">
              Who are the tournament drivers?
            </styled.label>

            <PeopleForm
              allowNewDrivers
              allowRandomize
              users={users}
              defaultValue={Array.from(
                new Set([
                  ...eventDrivers,
                  ...(tournament?.drivers.map((driver) => driver.driverId) ??
                    []),
                ]),
              )}
              name="drivers"
            />
          </Box>
        </Flex>

        {(format === TournamentsFormat.STANDARD ||
          format === TournamentsFormat.DOUBLE_ELIMINATION) && (
          <Flex gap={4}>
            <StepDot />
            <Box flex={1}>
              <styled.label display="block" mb={1}>
                Should all drivers participate in battles?
              </styled.label>
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

              <input
                type="hidden"
                name="fullInclusion"
                value={fullInclusion ? "true" : "false"}
              />

              <TabGroup>
                <TabButton
                  type="button"
                  isActive={!fullInclusion}
                  onClick={() => setFullInclusion(false)}
                >
                  No
                </TabButton>
                <TabButton
                  type="button"
                  isActive={fullInclusion}
                  onClick={() => setFullInclusion(true)}
                >
                  Yes
                </TabButton>
              </TabGroup>
            </Box>
          </Flex>
        )}

        <Flex gap={4}>
          <StepDot />
          <Box flex={1}>
            <styled.label mb={2} display="block">
              Which region is this tournament in?
            </styled.label>

            <input type="hidden" name="region" value={region} />

            <TabGroup>
              {Object.values(Regions).map((item) => {
                if (item === Regions.ALL) {
                  return null;
                }

                return (
                  <TabButton
                    type="button"
                    key={item}
                    isActive={region === item}
                    onClick={() => setRegion(item)}
                  >
                    {item}
                  </TabButton>
                );
              })}
            </TabGroup>
          </Box>
        </Flex>

        <Flex gap={4}>
          <StepDot />
          <Box flex={1} pb={24}>
            <styled.label display="block" mb={2}>
              Are you ready to start this tournament?
            </styled.label>
            <Button type="submit">I'm ready, let's go!</Button>
          </Box>
        </Flex>
      </Flex>
    </Form>
  );
};
