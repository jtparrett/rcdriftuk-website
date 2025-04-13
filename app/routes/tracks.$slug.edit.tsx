import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { TrackForm } from "~/components/TrackForm";
import { Box, Container, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getUserOwnedTrackBySlug } from "~/utils/getUserOwnedTrackBySlug.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    return redirect("/login");
  }

  invariant(args.params.slug, "Slug is required");

  const track = await getUserOwnedTrackBySlug(args.params.slug, userId);

  return track;
};

const TracksEditPage = () => {
  const track = useLoaderData<typeof loader>();

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
          <styled.h1 fontWeight="bold" lineHeight={1.2}>
            Edit Track
          </styled.h1>
        </Box>
        <Box p={6}>
          <TrackForm track={track} />
        </Box>
      </Box>
    </Container>
  );
};

export default TracksEditPage;
