import { Form } from "react-router";
import { styled, Box, Flex } from "~/styled-system/jsx";
import type { GetTournament } from "~/utils/getTournament.server";
import { Input } from "./Input";
import { Button } from "./Button";
import { Regions, TournamentsFormat } from "~/utils/enums";
import { capitalCase } from "change-case";
import type { GetUsers } from "~/utils/getUsers.server";
import { useMemo, useState } from "react";
import { RiDeleteBinFill } from "react-icons/ri";
import { StepDot } from "./StepDot";
import { Dropdown, Option } from "./Dropdown";
import { TabButton, TabGroup } from "./Tab";

interface Props {
  tournament: GetTournament;
  users: GetUsers;
  eventDrivers: number[];
}

const PeopleForm = ({
  users,
  defaultValue,
  name,
  allowNewDrivers = false,
}: {
  users: GetUsers;
  defaultValue: number[];
  name: string;
  allowNewDrivers?: boolean;
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
      {value.length > 0 && (
        <Box
          bgColor="gray.900"
          rounded="lg"
          mb={2}
          overflow="hidden"
          borderWidth={1}
          borderColor="gray.800"
        >
          <Box mb="-1px">
            {value.map((userId, i) => {
              const user = users.find((user) =>
                typeof userId === "string" ? false : user.driverId === userId,
              );

              return (
                <Flex
                  key={userId}
                  gap={1}
                  borderBottomWidth={1}
                  borderBottomColor="gray.800"
                >
                  <input type="hidden" name={name} value={userId} />
                  <styled.p py={1} px={4} flex={1}>
                    {user ? `${user.firstName} ${user.lastName}` : userId}
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
              );
            })}
          </Box>
        </Box>
      )}

      <Box pos="relative">
        <Input
          placeholder="Type to search..."
          onBlur={(e) => {
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

            {allowNewDrivers && (
              <Option
                type="button"
                onClick={() => {
                  onChange([...value, search]);
                  setSearch("");
                }}
              >
                Create "{search}" as a new driver
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
  const [fullInclusion, setFullInclusion] = useState(false);
  const [region, setRegion] = useState<Regions>(Regions.UK);
  const [format, setFormat] = useState(
    tournament?.format ?? TournamentsFormat.STANDARD,
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
                defaultValue={tournament?.qualifyingLaps}
              />
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
