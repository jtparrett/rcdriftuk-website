import { useFormik } from "formik";
import { RiImageAddLine, RiSendPlaneFill } from "react-icons/ri";
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
import { Textarea } from "~/components/Textarea";
import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getUser } from "~/utils/getUser.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";
import { userCanPost } from "~/utils/userCanPost";

const postSchema = z.object({
  content: z.string().min(1),
});

const validationSchema = toFormikValidationSchema(postSchema);

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    throw redirect("/sign-in");
  }

  const user = await getUser(userId);

  notFoundInvariant(user);

  const canPost = userCanPost(user);

  notFoundInvariant(canPost);

  return { user };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const { userId } = await getAuth(args);

  notFoundInvariant(userId);

  const user = await getUser(userId);

  notFoundInvariant(user);

  const canPost = userCanPost(user);

  notFoundInvariant(canPost);

  const formData = await request.json();
  const data = postSchema.parse(formData);

  await prisma.posts.create({
    data: {
      content: data.content,
      userId,
    },
  });

  return redirect(`/feed`);
};

const NewPostPage = () => {
  const submit = useSubmit();
  const { user } = useLoaderData<typeof loader>();

  const formik = useFormik({
    initialValues: {
      content: "",
    },
    validationSchema,
    async onSubmit(values) {
      await submit(JSON.stringify(values), {
        method: "POST",
        encType: "application/json",
      });
    },
  });

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
        <Flex gap={2} alignItems="center" mb={3}>
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
              src={user.image ?? "/blank-driver-right.jpg"}
              alt={`${user.firstName} ${user.lastName}`}
              w="full"
              h="full"
              objectFit="cover"
            />
          </Box>
          <Box>
            <styled.p fontWeight="medium" lineHeight="1.3">
              {user.firstName} {user.lastName}
            </styled.p>
          </Box>
        </Flex>

        <form onSubmit={formik.handleSubmit}>
          <Textarea
            placeholder={`What's on your mind, ${user.firstName}?`}
            name="content"
            value={formik.values.content}
            onChange={formik.handleChange}
            autoFocus
          />
          <Flex pt={2} gap={2}>
            <Spacer />
            <Button px={3} variant="secondary" type="button">
              <RiImageAddLine />
            </Button>
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
