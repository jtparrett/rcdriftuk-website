import { useFormik } from "formik";
import {
  redirect,
  useFetcher,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { Button, LinkButton } from "~/components/Button";
import { Input } from "~/components/Input";
import { Label } from "~/components/Label";
import { Box, Container, Flex, styled, VStack } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";
import type { Route } from "./+types/user.profile";
import { z } from "zod";
import invariant from "~/utils/invariant";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { FormControl } from "~/components/FormControl";
import { ImageInput } from "~/components/ImageInput";
import { uploadFile } from "~/utils/uploadFile.server";
import { resizeImage } from "~/utils/resizeImage";
import { AppName } from "~/utils/enums";

export const meta: Route.MetaFunction = () => {
  return [{ title: `${AppName} | Edit Profile` }];
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
  avatar: z.union([z.instanceof(File), z.string()]).optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  team: z.string().optional().nullable(),
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

  let avatarUrl: string | null = null;

  if (data.avatar instanceof File && data.avatar.size > 0) {
    avatarUrl = await uploadFile(data.avatar);
  }

  if (typeof data.avatar === "string") {
    avatarUrl = data.avatar;
  }

  await prisma.users.update({
    where: {
      id: userId,
    },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      team: data.team ?? null,
      image: avatarUrl,
    },
  });

  return redirect(`/user/profile`);
};

const UserProfilePage = () => {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const formik = useFormik<z.infer<typeof formSchema>>({
    validationSchema,
    initialValues: {
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      team: data.team ?? "",
      avatar: data.image ?? "",
    },
    onSubmit: async (values) => {
      const formData = new FormData();

      if (values.avatar instanceof File) {
        const result = await resizeImage(values.avatar);
        formData.append("avatar", result);
      } else if (values.avatar) {
        formData.append("avatar", values.avatar);
      }

      formData.append("firstName", values.firstName);
      formData.append("lastName", values.lastName);

      if (values.team) {
        formData.append("team", values.team);
      }

      await fetcher.submit(formData, {
        method: "POST",
        encType: "multipart/form-data",
      });
    },
  });

  return (
    <Container maxW={1100} px={2} py={10}>
      <Box maxW="580px" mx="auto">
        <styled.h2>Account Details</styled.h2>
        <Box
          p={6}
          mt={2}
          bgColor="gray.900"
          rounded="2xl"
          borderWidth={1}
          borderColor="gray.800"
        >
          <form onSubmit={formik.handleSubmit}>
            <VStack gap={4} alignItems="stretch">
              <FormControl error={formik.errors.avatar}>
                <Label>Avatar</Label>
                <ImageInput
                  name="avatar"
                  value={formik.values.avatar ?? null}
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
                  value={formik.values.team ?? ""}
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

        <LinkButton to="/user/delete" variant="outline" w="full" mt={6}>
          Delete My Account
        </LinkButton>
      </Box>
    </Container>
  );
};

export default UserProfilePage;
