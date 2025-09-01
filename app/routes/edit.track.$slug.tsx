import { TournamentsState } from "~/utils/enums";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { useLoaderData } from "react-router";
import invariant from "~/utils/invariant";
import { z } from "zod";
import { TrackForm } from "~/components/TrackForm";
import { Box, Container, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getUserOwnedTrackBySlug } from "~/utils/getUserOwnedTrackBySlug.server";
import { prisma } from "~/utils/prisma.server";
import { uploadFile } from "~/utils/uploadFile.server";
import type { Route } from "./+types/edit.track.$slug";

export const meta: Route.MetaFunction = ({ data }) => {
  return [
    { title: `RC Drift UK | ${data?.track.name} | Edit Track` },
    {
      property: "og:image",
      content: "https://rcdrift.uk/og-image.jpg",
    },
  ];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    return redirect("/sign-in");
  }

  invariant(args.params.slug, "Slug is required");

  const track = await getUserOwnedTrackBySlug(args.params.slug, userId);

  const leaderboards = await prisma.leaderboards.findMany({
    where: {
      userId,
    },
  });

  return {
    track,
    leaderboards,
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    return redirect("/sign-in");
  }

  invariant(args.params.slug, "Slug is required");

  const track = await getUserOwnedTrackBySlug(args.params.slug, userId);

  const clonedRequest = args.request.clone();
  const formData = await clonedRequest.formData();

  const data = z
    .object({
      image: z.union([z.instanceof(File), z.string()]),
      cover: z.union([z.instanceof(File), z.string()]).optional(),
      name: z.string(),
      description: z.string(),
      url: z.string(),
      address: z.string(),
      lat: z.coerce.number(),
      lng: z.coerce.number(),
      leaderboardId: z.string().optional(),
    })
    .parse(Object.fromEntries(formData.entries()));

  const { image, cover, ...update } = data;
  let imageUrl = "";
  let coverUrl: string | null = null;

  if (image instanceof File && image.size > 0) {
    imageUrl = await uploadFile(image);
  }

  if (typeof image === "string") {
    imageUrl = image;
  }

  if (cover instanceof File && cover.size > 0) {
    coverUrl = await uploadFile(cover);
  }

  if (typeof cover === "string") {
    coverUrl = cover;
  }

  await prisma.tracks.update({
    where: {
      id: track.id,
    },
    data: {
      ...update,
      image: imageUrl,
      cover: coverUrl,
      leaderboardId: data.leaderboardId === "" ? null : data.leaderboardId,
    },
  });

  return redirect(`/tracks/${args.params.slug}`);
};

const TracksEditPage = () => {
  const { track, leaderboards } = useLoaderData<typeof loader>();

  return (
    <Container maxW={1100} px={4} py={8}>
      <Box
        bgColor="gray.900"
        borderWidth={1}
        borderColor="gray.800"
        borderRadius="xl"
        maxW={600}
        mb={4}
      >
        <Box px={6} py={2} bgColor="gray.800" borderTopRadius="inherit">
          <styled.h1 fontWeight="bold" lineHeight={1.2}>
            Edit Track
          </styled.h1>
        </Box>
        <Box p={6}>
          <TrackForm track={track} leaderboards={leaderboards} />
        </Box>
      </Box>
    </Container>
  );
};

export default TracksEditPage;
