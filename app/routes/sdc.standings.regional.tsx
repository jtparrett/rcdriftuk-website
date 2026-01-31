import { useLoaderData } from "react-router";
import { Container, Flex } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { SDC_USER_ID } from "~/utils/theme";

export const loader = async () => {
  const leaderboards = await prisma.leaderboards.findMany({
    where: {
      userId: SDC_USER_ID,
    },
    orderBy: {
      name: "asc",
    },
  });

  return leaderboards;
};

const Page = () => {
  const leaderboards = useLoaderData<typeof loader>();

  return (
    <Container maxW={1100} px={4} py={4}>
      <Flex flexDir="column" gap={4}>
        {leaderboards.map((leaderboard) => (
          <div key={leaderboard.id}>{leaderboard.name}</div>
        ))}
      </Flex>
    </Container>
  );
};

export default Page;
