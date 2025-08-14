import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import type { Route } from "./+types/setup";
import { prisma } from "~/utils/prisma.server";
import {
  useLoaderData,
  useSubmit,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { capitalCase } from "change-case";
import { formatDistanceToNow } from "date-fns";
import { Select } from "~/components/Select";
import { CAR_SETUP_CHANGE_TYPES, getCarSetupValues } from "~/utils/carSetup";
import { useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import z from "zod";
import { Button } from "~/components/Button";
import { CarSetupSummary } from "~/components/CarSetupSummary";
import { Input } from "~/components/Input";

export const meta: Route.MetaFunction = () => {
  return [{ title: `RC Drift UK | Setup Changes` }];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  const data = await prisma.carSetupChanges.findMany({
    where: { userId },
    orderBy: { id: "desc" },
  });

  return data;
};

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  const formData = await args.request.formData();

  const data = formSchema.parse({
    type: formData.get("type"),
    value: formData.get("value"),
    chassis: formData.get("chassis"),
  });

  await prisma.carSetupChanges.create({
    data: {
      userId,
      type: data.type,
      value: data.chassis ? data.chassis : data.value,
    },
  });

  return null;
};

const formSchema = z.object({
  type: z.nativeEnum(CAR_SETUP_CHANGE_TYPES),
  value: z.string(),
  chassis: z.string().optional().nullable(),
});

const validationSchema = toFormikValidationSchema(formSchema);

const SetupPage = () => {
  const setupChanges = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const formik = useFormik({
    validationSchema,
    isInitialValid: false,
    initialValues: {
      type: null,
      value: null,
      chassis: null,
    },
    async onSubmit(values) {
      const formData = new FormData();

      formData.append("type", values.type ?? "");
      formData.append("value", values.value ?? "");
      formData.append("chassis", values.chassis ?? "");

      await submit(formData, {
        method: "POST",
      });

      formik.resetForm();
    },
  });

  return (
    <Container maxW={600} px={4} py={6}>
      <styled.h1 mb={2} fontWeight="extrabold" fontSize="2xl">
        Setup Changes
      </styled.h1>

      {setupChanges.length === 0 && (
        <>
          <styled.p mb={1}>Track your car setup changes over time.</styled.p>
          <styled.p mb={4}>
            Begin by logging your current setup, and keep it updated as you make
            changes. Your setup will be visible on your driver profile.
          </styled.p>
        </>
      )}

      <Flex flexDir="column" gap={2}>
        <Box
          bgColor="gray.900"
          p={4}
          rounded="lg"
          borderWidth={1}
          borderColor="gray.800"
        >
          <form onSubmit={formik.handleSubmit}>
            <Select
              name="type"
              value={formik.values.type ?? ""}
              onChange={formik.handleChange}
            >
              <option>Select an option...</option>
              {Object.values(CAR_SETUP_CHANGE_TYPES).map((type) => (
                <option key={type} value={type}>
                  {capitalCase(type)}
                </option>
              ))}
            </Select>

            {formik.values.type && (
              <Select
                name="value"
                value={formik.values.value ?? ""}
                onChange={formik.handleChange}
                mt={2}
              >
                <option>Select an option...</option>
                {Object.values(getCarSetupValues(formik.values.type)).map(
                  (value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ),
                )}
              </Select>
            )}

            {formik.values.type === CAR_SETUP_CHANGE_TYPES.CHASSIS &&
              formik.values.value === "Other" && (
                <Input
                  name="chassis"
                  value={formik.values.chassis ?? ""}
                  onChange={formik.handleChange}
                  mt={2}
                  placeholder="Enter your chassis..."
                />
              )}

            {formik.isValid && (
              <Button
                type="submit"
                mt={2}
                w="full"
                isLoading={formik.isSubmitting}
                disabled={formik.isSubmitting}
              >
                Submit Change
              </Button>
            )}
          </form>
        </Box>

        {setupChanges.length > 0 && (
          <>
            <styled.h2 fontWeight="medium" fontSize="lg" mt={4}>
              Current Setup
            </styled.h2>

            <CarSetupSummary history={setupChanges} />

            <styled.h2 fontWeight="medium" fontSize="lg" mt={4}>
              Setup History
            </styled.h2>

            {setupChanges.map((change) => (
              <Box
                key={change.id}
                bgColor="gray.900"
                p={4}
                rounded="lg"
                borderWidth={1}
                borderColor="gray.800"
              >
                <styled.p color="gray.400">
                  <styled.span fontWeight="medium" color="brand.500">
                    {capitalCase(change.type)}
                  </styled.span>{" "}
                  set to{" "}
                  <styled.span fontWeight="medium" color="brand.500">
                    {change.value}
                  </styled.span>{" "}
                  {formatDistanceToNow(change.createdAt, { addSuffix: true })}
                </styled.p>
              </Box>
            ))}
          </>
        )}
      </Flex>
    </Container>
  );
};

export default SetupPage;
