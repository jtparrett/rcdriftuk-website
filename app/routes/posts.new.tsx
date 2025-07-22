import { useMutation } from "@tanstack/react-query";
import { useFormik } from "formik";
import {
  RiArrowDownSLine,
  RiDeleteBinFill,
  RiSendPlaneFill,
} from "react-icons/ri";
import {
  redirect,
  useLoaderData,
  useSubmit,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { Button } from "~/components/Button";
import { Dropdown, Option } from "~/components/Dropdown";
import { ImageInput } from "~/components/ImageInput";
import { Label } from "~/components/Label";
import { Textarea } from "~/components/Textarea";
import { UserTaggingInput } from "~/components/UserTaggingInput";
import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { extractFirstUrl } from "~/utils/extractFirstUrl";
import { fetchAndUploadOgImage } from "~/utils/fetchAndUploadOgImage.server";
import { getAuth } from "~/utils/getAuth.server";
import { getUser } from "~/utils/getUser.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";
import { useDisclosure } from "~/utils/useDisclosure";
import { userIsVerified } from "~/utils/userIsVerified";

const postSchema = z.object({
  content: z.string().min(1),
  images: z.array(z.string()),
  trackId: z.string().nullable(),
});

const validationSchema = toFormikValidationSchema(postSchema);

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    throw redirect("/sign-in");
  }

  const user = await getUser(userId);

  notFoundInvariant(user);

  const canPost = userIsVerified(user);

  notFoundInvariant(canPost);

  const userTracks = await prisma.tracks.findMany({
    where: {
      Owners: {
        some: {
          userId,
        },
      },
    },
  });

  return { user, userTracks };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const { userId } = await getAuth(args);

  notFoundInvariant(userId);

  const user = await getUser(userId);

  notFoundInvariant(user);

  const canPost = userIsVerified(user);

  notFoundInvariant(canPost);

  const formData = await request.json();
  const data = postSchema.parse(formData);

  // Extract first URL from content and fetch og:image if no images are provided
  let finalImages = data.images;
  if (data.images.length === 0) {
    const firstUrl = extractFirstUrl(data.content);
    if (firstUrl) {
      const ogImageUrl = await fetchAndUploadOgImage(firstUrl);
      if (ogImageUrl) {
        finalImages = [ogImageUrl];
      }
    }
  }

  const post = await prisma.posts.create({
    data: {
      userId,
      content: data.content,
      images: finalImages,
      trackId: data.trackId,
    },
  });

  return redirect(`/posts/${post.id}`);
};

const NewPostPage = () => {
  const submit = useSubmit();
  const { user, userTracks } = useLoaderData<typeof loader>();
  const dropdownDisclosure = useDisclosure();

  const formik = useFormik({
    initialValues: {
      content: "",
      images: [],
      trackId: null,
    },
    validationSchema,
    async onSubmit(values) {
      await submit(JSON.stringify(values), {
        method: "POST",
        encType: "application/json",
      });
    },
  });

  const fileUploadMutation = useMutation({
    async mutationFn(file: File) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      return z.object({ url: z.string() }).parse(data);
    },
    onSuccess(data) {
      formik.setFieldValue("images", [...formik.values.images, data.url]);
    },
  });

  const postAsTrack = userTracks.find(
    (track) => track.id === formik.values.trackId,
  );
  const postAsAvatar =
    postAsTrack?.image ?? user.image ?? "/blank-driver-right.jpg";
  const postAsName = postAsTrack?.name ?? `${user.firstName} ${user.lastName}`;

  return (
    <Container maxW={680} px={2} py={2}>
      <Box
        bgColor="gray.900"
        rounded="xl"
        py={3}
        px={4}
        borderWidth={1}
        borderColor="gray.800"
      >
        <Box pos="relative" mb={3}>
          <styled.button
            onClick={dropdownDisclosure.toggle}
            cursor="pointer"
            type="button"
          >
            <Flex
              gap={2}
              alignItems="center"
              w="fit-content"
              borderWidth={1}
              borderColor="gray.800"
              rounded="lg"
              p={2}
            >
              <Box
                rounded="full"
                overflow="hidden"
                borderWidth={1}
                borderColor="gray.700"
                bg="gray.950"
                w={10}
                h={10}
              >
                <styled.img
                  display="block"
                  src={postAsAvatar}
                  alt="Profile image"
                  w="full"
                  h="full"
                  objectFit="cover"
                />
              </Box>
              <Box>
                <styled.p fontWeight="medium" lineHeight="1.3">
                  {postAsName}
                </styled.p>
              </Box>
              <RiArrowDownSLine />
            </Flex>
          </styled.button>

          {dropdownDisclosure.isOpen && (
            <Dropdown role="listbox">
              <styled.p
                color="gray.400"
                fontSize="sm"
                px={2}
                borderBottomWidth={1}
                borderColor="gray.700"
              >
                Post as...
              </styled.p>
              <Option
                onClick={() => {
                  formik.setFieldValue("trackId", null);
                  dropdownDisclosure.onClose();
                }}
              >
                {user.firstName} {user.lastName}
              </Option>
              {userTracks.map((track) => (
                <Option
                  key={track.id}
                  onClick={() => {
                    formik.setFieldValue("trackId", track.id);
                    dropdownDisclosure.onClose();
                  }}
                >
                  {track.name}
                </Option>
              ))}
            </Dropdown>
          )}
        </Box>

        <form onSubmit={formik.handleSubmit}>
          <styled.input
            type="hidden"
            name="trackId"
            value={formik.values.trackId ?? ""}
          />

          <UserTaggingInput
            placeholder={`What's on your mind, ${user.firstName}?`}
            name="content"
            value={formik.values.content}
            onChange={(value) => formik.setFieldValue("content", value)}
            autoFocus
          />
          <Flex pt={2} gap={2}>
            <Spacer />
            {formik.values.images.map((image) => (
              <Box
                key={image}
                w={10}
                h={10}
                overflow="hidden"
                rounded="lg"
                pos="relative"
              >
                <styled.img
                  src={image}
                  alt="Uploaded"
                  w="full"
                  h="full"
                  objectFit="cover"
                />
                <styled.button
                  pos="absolute"
                  inset={0}
                  type="button"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  onClick={() => {
                    formik.setFieldValue(
                      "images",
                      formik.values.images.filter((i) => i !== image),
                    );
                  }}
                >
                  <RiDeleteBinFill />
                </styled.button>
              </Box>
            ))}
            <ImageInput
              name="avatar"
              size={10}
              onChange={fileUploadMutation.mutate}
              value={null}
              isLoading={fileUploadMutation.isPending}
            />
            <Button
              type="submit"
              isLoading={formik.isSubmitting}
              disabled={formik.isSubmitting || !formik.isValid}
            >
              Create Post <RiSendPlaneFill />
            </Button>
          </Flex>
        </form>
      </Box>
    </Container>
  );
};

export default NewPostPage;
