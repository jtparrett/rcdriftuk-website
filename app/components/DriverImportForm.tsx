import { Form } from "@remix-run/react";
import { Button } from "./Button";
import { styled, Box, Flex } from "~/styled-system/jsx";
import { Input } from "./Input";

export const DriverImportForm = ({
  tournamentId,
}: {
  tournamentId: string;
}) => {
  return (
    <Box
      maxW={600}
      bgColor="gray.900"
      rounded="xl"
      p={4}
      mt={6}
      borderWidth={1}
      borderColor="gray.800"
      borderStyle="dashed"
    >
      <Form
        method="post"
        action={`/tournaments/${tournamentId}/drivers/import`}
      >
        <styled.h3 mb={2} fontWeight="bold" fontSize="lg">
          Psst... want to import drivers via CSV?
        </styled.h3>
        <styled.p mb={4} color="gray.400">
          Upload a CSV file with a "Driver ID" column to import drivers.
        </styled.p>
        <Flex gap={2}>
          <Input
            type="file"
            name="csv"
            accept=".csv"
            flex={1}
            cursor="pointer"
          />
          <Button variant="secondary" type="submit" flex="none">
            Upload CSV
          </Button>
        </Flex>
      </Form>
    </Box>
  );
};
