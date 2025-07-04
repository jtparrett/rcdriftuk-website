import { useFormik } from "formik";
import {
  redirect,
  useSubmit,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { Button } from "~/components/Button";
import { Textarea } from "~/components/Textarea";
import { Container, Flex, Spacer } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

const postSchema = z.object({
  content: z.string().min(1),
});

const validationSchema = toFormikValidationSchema(postSchema);

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    throw redirect("/sign-in");
  }

  return null;
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const { userId } = await getAuth(args);

  notFoundInvariant(userId);

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
    <Container maxW={680} px={2} py={4}>
      <form onSubmit={formik.handleSubmit}>
        <Textarea
          placeholder="What's on your mind?"
          name="content"
          value={formik.values.content}
          onChange={formik.handleChange}
          autoFocus
        />
        <Flex pt={2}>
          <Spacer />
          <Button
            type="submit"
            isLoading={formik.isSubmitting}
            disabled={formik.isSubmitting || !formik.isValid}
          >
            Post
          </Button>
        </Flex>
      </form>
    </Container>
  );
};

export default NewPostPage;
