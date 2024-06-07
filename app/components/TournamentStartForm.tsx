import { Form } from "@remix-run/react";
import { styled, Box, Flex } from "~/styled-system/jsx";
import { StepNumber } from "./StepNumber";
import type { GetTournament } from "~/utils/getTournament.server";
import { Input } from "./Input";
import { Button } from "./Button";
import { Select } from "./Select";
import { TournamentsFormat } from "@prisma/client";
import { capitalCase } from "change-case";

interface Props {
  tournament: GetTournament;
}

export const TournamentStartForm = ({ tournament }: Props) => {
  return (
    <Form method="post">
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
              Who are your tournament judges?
            </styled.label>

            <styled.textarea
              w="full"
              display="block"
              minH={82}
              bgColor="gray.800"
              p={4}
              rounded="lg"
              placeholder="List your tournament judges seperated by a comma (,)"
              name="judges"
            ></styled.textarea>
          </Box>
        </Flex>

        <Flex gap={4}>
          <StepNumber value={4} />
          <Box flex={1}>
            <styled.label mb={2} display="block">
              Who are your tournament drivers?
            </styled.label>

            <styled.textarea
              w="full"
              display="block"
              minH={180}
              bgColor="gray.800"
              p={4}
              rounded="lg"
              placeholder="List your tournament drivers seperated by a comma (,)"
              name="drivers"
            ></styled.textarea>
          </Box>
        </Flex>

        <Flex gap={4}>
          <StepNumber value={5} />
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
