import { useFormik } from "formik";
import {
  redirect,
  useFetcher,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "react-router";
import { Button } from "~/components/Button";
import { Input } from "~/components/Input";
import { Label } from "~/components/Label";
import { Box, Container, Flex, VStack } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";
import type { Route } from "./+types/user.profile";
import { z } from "zod";
import invariant from "tiny-invariant";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { FormControl } from "~/components/FormControl";
import { ImageInput } from "~/components/ImageInput";
import { uploadFile } from "~/utils/uploadFile.server";

export const meta: Route.MetaFunction = () => {
  return [{ title: "RC Drift UK | Edit Profile" }];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  const data = await prisma.users.findFirst({
    where: {
      id: userId,
    },
  });

  if (!data) {
    throw new Response("Not Found", { status: 404 });
  }

  return data;
};

const formSchema = z.object({
  avatar: z.instanceof(File).nullable().optional(),
  firstName: z.string(),
  lastName: z.string(),
  team: z.string().optional(),
});

const validationSchema = toFormikValidationSchema(formSchema);

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);

  invariant(userId, "User is required");

  const clonedRequest = args.request.clone();
  const formData = await clonedRequest.formData();
  const avatar = formData.get("avatar");
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const team = formData.get("team") ?? null;

  const data = formSchema.parse({
    avatar,
    firstName,
    lastName,
    team,
  });

  let avatarUrl = null;

  if (data.avatar && data.avatar.size > 0) {
    avatarUrl = await uploadFile(data.avatar);
  }

  await prisma.users.update({
    where: {
      id: userId,
    },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      team: data.team ?? null,
      ...(avatarUrl && {
        image: avatarUrl,
      }),
    },
  });

  return redirect(`/user/profile`);
};

const UserProfilePage = () => {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const formik = useFormik({
    validationSchema,
    initialValues: {
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      team: data.team ?? "",
      avatar: null,
    },
    onSubmit: async (values) => {
      const formData = new FormData();
      formData.append("firstName", values.firstName);
      formData.append("lastName", values.lastName);
      formData.append("team", values.team);

      if (values.avatar) {
        formData.append("avatar", values.avatar);
      }

      await fetcher.submit(formData, {
        method: "POST",
        encType: "multipart/form-data",
      });
    },
  });

  return (
    <Container maxW={1100} px={2} py={10}>
      <Box p={6} bgColor="gray.900" rounded="2xl" maxW="580px" mx="auto">
        <form onSubmit={formik.handleSubmit}>
          <VStack gap={4} alignItems="stretch">
            <FormControl error={formik.errors.avatar}>
              <Label>Avatar</Label>
              <ImageInput
                name="avatar"
                value={formik.values.avatar}
                onChange={(file) => {
                  formik.setFieldValue("avatar", file);
                }}
              />
            </FormControl>

            <Flex gap={4}>
              <FormControl flex={1} error={formik.errors.firstName}>
                <Label>First Name</Label>
                <Input
                  name="firstName"
                  value={formik.values.firstName}
                  onChange={formik.handleChange}
                />
              </FormControl>
              <FormControl flex={1} error={formik.errors.lastName}>
                <Label>Last Name</Label>
                <Input
                  name="lastName"
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                />
              </FormControl>
            </Flex>

            <FormControl error={formik.errors.team}>
              <Label>Team(s)</Label>
              <Input
                name="team"
                value={formik.values.team}
                onChange={formik.handleChange}
              />
            </FormControl>

            <Button
              type="submit"
              disabled={formik.isSubmitting || !formik.isValid}
              isLoading={formik.isSubmitting}
            >
              Save Changes
            </Button>
          </VStack>
        </form>
      </Box>
    </Container>
  );
};

export default UserProfilePage;
