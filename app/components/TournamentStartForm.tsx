import { Form } from "react-router";
import { styled, Box, Flex } from "~/styled-system/jsx";
import type { GetTournament } from "~/utils/getTournament.server";
import { Input } from "./Input";
import { Button } from "./Button";
import { Select } from "./Select";
import { TournamentsFormat } from "~/utils/enums";
import { capitalCase } from "change-case";
import type { GetUsers } from "~/utils/getUsers.server";
import { useMemo, useState } from "react";
import { RiDeleteBinFill } from "react-icons/ri";
import { isOneOf } from "~/utils/oneOf";
import { StepDot } from "./StepDot";
import { Dropdown, Option } from "./Dropdown";

interface Props {
  tournament: GetTournament;
  users: GetUsers;
  eventDrivers: number[];
}
const PeopleForm = ({
  users,
  defaultValue,
  name,
}: {
  users: GetUsers;
  defaultValue: number[];
  name: string;
}) => {
  const [value, onChange] = useState(defaultValue);
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
    <Box bgColor="gray.900" rounded="lg">
      {value.map((userId) => {
        const user = users.find((user) => user.driverId === userId);

        return (
          <Flex
            key={userId}
            gap={1}
            borderBottomWidth={1}
            borderBottomColor="gray.700"
          >
            <input type="hidden" name={name} value={userId} />
            <styled.p py={1} px={4} flex={1}>
              {user?.firstName} {user?.lastName}
            </styled.p>

            <Box p={1}>
              <Button
                px={1}
                size="xs"
                type="button"
                variant="ghost"
                onClick={() => {
                  onChange(value.filter((id) => id !== userId));
                }}
              >
                <RiDeleteBinFill />
              </Button>
            </Box>
          </Flex>
        );
      })}

      <Box pos="relative">
        <Input
          placeholder="Type to search..."
          onBlur={(e) => {
            // Only blur if we're not clicking inside the dropdown
            if (!e.relatedTarget?.closest('[role="listbox"]')) {
              setFocused(false);
            }
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
            <Select
              name="format"
              value={format}
              onChange={(e) => {
                if (isOneOf(e.target.value, Object.values(TournamentsFormat))) {
                  setFormat(e.target.value);
                }
              }}
            >
              {Object.values(TournamentsFormat).map((format) => {
                return (
                  <styled.option key={format} value={format}>
                    {capitalCase(format)}
                  </styled.option>
                );
              })}
            </Select>
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

              <Flex
                p={1}
                display="inline-flex"
                bgColor="gray.800"
                rounded="full"
              >
                <Button
                  type="button"
                  variant={!fullInclusion ? "primary" : "ghost"}
                  onClick={() => setFullInclusion(false)}
                >
                  No
                </Button>
                <Button
                  type="button"
                  variant={fullInclusion ? "primary" : "ghost"}
                  onClick={() => setFullInclusion(true)}
                >
                  Yes
                </Button>
              </Flex>
            </Box>
          </Flex>
        )}

        <Flex gap={4}>
          <StepDot />
          <Box flex={1}>
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
