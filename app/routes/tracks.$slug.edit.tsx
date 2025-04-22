import { TrackTypes } from "@prisma/client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { z } from "zod";
import { TrackForm } from "~/components/TrackForm";
import { Box, Container, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getUserOwnedTrackBySlug } from "~/utils/getUserOwnedTrackBySlug.server";
import { prisma } from "~/utils/prisma.server";
import { uploadFile } from "~/utils/uploadFile.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    return redirect("/sign-in");
  }

  invariant(args.params.slug, "Slug is required");

  const track = await getUserOwnedTrackBySlug(args.params.slug, userId);

  return track;
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
      image: z.instanceof(File).optional(),
      name: z.string().optional(),
      description: z.string().optional(),
      url: z.string().optional(),
      address: z.string().optional(),
      lat: z.coerce.number().optional(),
      lng: z.coerce.number().optional(),
      types: z.array(z.nativeEnum(TrackTypes)).optional(),
    })
    .parse(Object.fromEntries(formData.entries()));

  const { image, ...update } = data;
  let imageUrl = null;

  if (image && image.size > 0) {
    imageUrl = await uploadFile(image);
  }

  await prisma.tracks.update({
    where: {
      id: track.id,
    },
    data: {
      ...update,
      ...(imageUrl && { image: imageUrl }),
    },
  });

  return redirect(`/tracks/${args.params.slug}`);
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
      >
        <Box px={6} py={2} bgColor="gray.800">
          <styled.h1 fontWeight="bold" lineHeight={1.2}>
            Edit Track
          </styled.h1>
        </Box>
        <Box p={6}>
          <Form method="post" encType="multipart/form-data">
            <TrackForm track={track} />
          </Form>
        </Box>
      </Box>
    </Container>
  );
};

export default TracksEditPage;
