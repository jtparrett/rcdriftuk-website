import { getAuth } from "@clerk/remix/ssr.server";
import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, redirect } from "@remix-run/react";
import invariant from "tiny-invariant";
import { z } from "zod";
import { Button } from "~/components/Button";
import { Glow } from "~/components/Glow";
import { Input } from "~/components/Input";
import { Label } from "~/components/Label";
import { styled, Box, Flex, Center } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);

  invariant(userId);

  const formData = await args.request.formData();
  const name = z.string().min(1).parse(formData.get("name"));

  const tournament = await prisma.tournaments.create({
    data: {
      userId,
      name,
    },
  });

  return redirect(`/tournaments/${tournament.id}`);
};

const Page = () => {
  return (
    <Center minH="70dvh">
      <Box
        w={400}
        maxW="full"
        p={1}
        rounded="xl"
        borderWidth="1px"
        borderColor="brand.500"
        pos="relative"
        zIndex={1}
      >
        <Glow />
        <Box p={4} borderWidth="1px" borderColor="gray.800" rounded="lg">
          <styled.h1 fontWeight="extrabold" fontSize="2xl" mb={4}>
            New Tournament
          </styled.h1>

          <Form method="post">
            <Flex gap={2} flexDir="column">
              <Box>
                <Label>Tournament Name</Label>
                <Input name="name" placeholder="Type here..." required />
              </Box>
              <Button type="submit">Create Tournament</Button>
            </Flex>
          </Form>
        </Box>
      </Box>
    </Center>
  );
};

export default Page;
