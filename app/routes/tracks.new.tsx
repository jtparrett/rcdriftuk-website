import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { z } from "zod";
import { TrackForm } from "~/components/TrackForm";
import { styled, Container, Box } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";
import { uploadFile } from "~/utils/uploadFile.server";
import slugify from "slugify";
import type { Route } from "./+types/tracks.new";
import { AppName, Regions } from "~/utils/enums";

export const meta: Route.MetaFunction = () => {
  return [{ title: `${AppName} | Create a Track` }];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    return redirect("/sign-in");
  }

  const currentUser = await prisma.users.findFirst({
    where: { id: userId },
    select: {
      id: true,
      driverId: true,
      firstName: true,
      lastName: true,
      image: true,
    },
  });

  if (!currentUser || !currentUser.id) {
    return redirect("/sign-in");
  }

  return {
    currentUserId: userId,
    currentUser: {
      userId: currentUser.id,
      driverId: currentUser.driverId,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      image: currentUser.image,
    },
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const clonedRequest = args.request.clone();
  const formData = await clonedRequest.formData();

  const { userId } = await getAuth(args);

  if (!userId) {
    throw redirect("/sign-in");
  }

  const ownerUserIds = z
    .array(z.string().min(1))
    .min(1, "At least one owner is required")
    .parse(formData.getAll("ownerUserIds"));

  if (!ownerUserIds.includes(userId)) {
    ownerUserIds.push(userId);
  }

  const data = z
    .object({
      name: z.string(),
      description: z.string(),
      url: z.string(),
      image: z.instanceof(File),
      cover: z.instanceof(File).optional(),
      lat: z.coerce.number(),
      lng: z.coerce.number(),
      address: z.string(),
      region: z.nativeEnum(Regions),
    })
    .parse(Object.fromEntries(formData.entries()));

  const imageUrl = await uploadFile(data.image);
  let coverUrl = null;

  if (data.cover && data.cover.size > 0) {
    coverUrl = await uploadFile(data.cover);
  }

  const track = await prisma.tracks.create({
    data: {
      ...data,
      slug: slugify(data.name, {
        lower: true,
        strict: true,
      }),
      image: imageUrl,
      cover: coverUrl,
      Owners: {
        create: ownerUserIds.map((uid) => ({ userId: uid })),
      },
    },
  });

  return redirect(`/tracks/${track.slug}`);
};

const TracksNewPage = () => {
  const { currentUserId, currentUser } = useLoaderData<typeof loader>();

  return (
    <Container maxW={1100} px={4} py={8}>
      <Box
        bgColor="gray.900"
        borderWidth={1}
        borderColor="gray.800"
        borderRadius="xl"
        maxW={600}
      >
        <Box px={6} py={2} bgColor="gray.800" borderTopRadius="xl">
          <styled.h1 fontWeight="bold">Register a new Track</styled.h1>
        </Box>
        <Box p={6}>
          <TrackForm
            currentUserId={currentUserId}
            defaultOwners={[currentUser]}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default TracksNewPage;
