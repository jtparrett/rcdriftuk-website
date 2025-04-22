import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { z } from "zod";
import { TrackForm } from "~/components/TrackForm";
import { styled, Container, Box } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";
import { uploadFile } from "~/utils/uploadFile.server";
import slugify from "slugify";

export const meta: MetaFunction = () => {
  return [{ title: "RC Drift UK | Create a Track" }];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    return redirect("/sign-in");
  }

  return null;
};

export const action = async (args: ActionFunctionArgs) => {
  const clonedRequest = args.request.clone();
  const formData = await clonedRequest.formData();

  const { userId } = await getAuth(args);

  if (!userId) {
    throw redirect("/sign-in");
  }

  const data = z
    .object({
      name: z.string(),
      description: z.string(),
      url: z.string().url(),
      image: z.instanceof(File).refine((file) => file.size > 0, {
        message: "Image is required",
      }),
      lat: z.number(),
      lng: z.number(),
      address: z.string(),
    })
    .parse({
      name: formData.get("name"),
      description: formData.get("description"),
      url: formData.get("url"),
      image: formData.get("image"),
      lat: parseFloat(formData.get("lat") as string),
      lng: parseFloat(formData.get("lng") as string),
      address: formData.get("address"),
    });

  const imageUrl = await uploadFile(data.image);

  const track = await prisma.tracks.create({
    data: {
      ...data,
      slug: slugify(data.name, {
        lower: true,
        strict: true,
      }),
      image: imageUrl,
      Owners: {
        create: {
          userId,
        },
      },
    },
  });

  return redirect(`/tracks/${track.slug}`);
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
          <Form method="post" encType="multipart/form-data">
            <TrackForm />
          </Form>
        </Box>
      </Box>
    </Container>
  );
};

export default TracksNewPage;
