import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { TrackForm } from "~/components/TrackForm";
import { styled, Container, Box } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";

export const meta: MetaFunction = () => {
  return [{ title: "RC Drift UK | Create a Track" }];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    return redirect("/login");
  }

  return null;
};

const TracksNewPage = () => {
  return (
    <Container maxW={1100} px={4} py={8}>
      <Box
        bgColor="gray.900"
        borderWidth={1}
        borderColor="gray.800"
        borderRadius="xl"
        maxW={600}
        overflow="hidden"
      >
        <Box px={6} py={2} bgColor="gray.800">
          <styled.h1 fontWeight="bold">Register a new Track</styled.h1>
        </Box>
        <Box p={6}>
          <TrackForm />
        </Box>
      </Box>
    </Container>
  );
};

export default TracksNewPage;
