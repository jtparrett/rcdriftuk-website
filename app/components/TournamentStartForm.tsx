import { Form } from "react-router";
import { styled, Box, Flex } from "~/styled-system/jsx";
import { StepNumber } from "./StepNumber";
import type { GetTournament } from "~/utils/getTournament.server";
import { Input } from "./Input";
import { Button } from "./Button";
import { Select } from "./Select";
import { TournamentsFormat } from "~/utils/enums";
import { capitalCase } from "change-case";
import type { GetUsers } from "~/utils/getUsers.server";
import { useState } from "react";
import { RiDeleteBinFill } from "react-icons/ri";

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

  return (
    <Box bgColor="gray.900" rounded="lg" overflow="hidden">
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

      <Select
        rounded="none"
        borderTopWidth={1}
        borderTopColor="gray.900"
        onChange={(e) => onChange([...value, Number(e.target.value)])}
      >
        <option>Select a person...</option>
        {users
          .filter((user) => !value.includes(user.driverId))
          .map((user) => {
            return (
              <option key={user.driverId} value={user.driverId}>
                {user.firstName} {user.lastName}
              </option>
            );
          })}
      </Select>
    </Box>
  );
};

export const TournamentStartForm = ({
  tournament,
  users,
  eventDrivers,
}: Props) => {
  const [fullInclusion, setFullInclusion] = useState(false);

  return (
    <Form method="post" action={`/api/tournaments/${tournament?.id}/start`}>
      <Flex overflow="hidden" flexDir="column" gap={8} maxW={600}>
        <Flex gap={4}>
          <StepNumber value={1} />
          <Box flex={1}>
            <styled.label mb={2} display="block">
              What format is this tournament?
            </styled.label>
            <Select name="format" defaultValue={tournament?.format}>
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

        <Flex gap={4}>
          <StepNumber value={2} />
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

        <Flex gap={4}>
          <StepNumber value={3} />
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
          <StepNumber value={4} />
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

        <Flex gap={4}>
          <StepNumber value={5} />
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
              gap={2}
              p={1}
              display="inline-flex"
              bgColor="gray.800"
              rounded="xl"
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

        <Flex gap={4}>
          <StepNumber value={6} />
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
