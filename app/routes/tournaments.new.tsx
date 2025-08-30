import { getAuth } from "~/utils/getAuth.server";
import type { ActionFunctionArgs } from "react-router";
import { Form, redirect, useFetcher, useSearchParams } from "react-router";
import invariant from "~/utils/invariant";
import { z } from "zod";
import { Button } from "~/components/Button";
import { Glow } from "~/components/Glow";
import { Input } from "~/components/Input";
import { Label } from "~/components/Label";
import { styled, Box, Flex, Center } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { FormControl } from "~/components/FormControl";
import { Select } from "~/components/Select";
import { TOURNAMENT_TEMPLATES } from "~/utils/tournamentTemplates";
import { capitalCase } from "change-case";

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);

  invariant(userId, "User not found");

  const formData = await args.request.formData();
  const eventId = z
    .string()
    .optional()
    .nullable()
    .parse(formData.get("eventId"));
  const template = z
    .string()
    .optional()
    .nullable()
    .parse(formData.get("template"));
  const name = z.string().min(1).parse(formData.get("name"));

  const tournament = await prisma.tournaments.create({
    data: {
      userId,
      name,
    },
  });

  const searchParams = new URLSearchParams();

  if (eventId) {
    searchParams.set("eventId", eventId);
  }

  if (template) {
    searchParams.set("template", template);
  }

  return redirect(`/tournaments/${tournament.id}?${searchParams.toString()}`);
};

const formSchema = z.object({
  name: z.string().min(1),
  template: z.string().optional(),
});

const validationSchema = toFormikValidationSchema(formSchema);

const Page = () => {
  const fetcher = useFetcher();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId");

  const formik = useFormik({
    initialValues: {
      name: "",
      template: "",
    },
    validationSchema,
    async onSubmit(values) {
      const formData = new FormData();

      formData.append("name", values.name);

      if (eventId) {
        formData.append("eventId", eventId);
      }

      if (values.template) {
        formData.append("template", values.template);
      }

      await fetcher.submit(formData, {
        method: "POST",
      });
    },
  });

  return (
    <Center minH="70dvh">
      <Box
        w={400}
        maxW="full"
        p={1}
        rounded="xl"
        borderWidth="1px"
        borderColor="brand.500"
        pos="relative"
        zIndex={1}
      >
        <Glow />
        <Box p={4} borderWidth="1px" borderColor="gray.800" rounded="lg">
          <styled.h1 fontWeight="extrabold" fontSize="2xl" mb={4}>
            New Tournament
          </styled.h1>

          <form onSubmit={formik.handleSubmit}>
            <Flex gap={2} flexDir="column">
              <FormControl error={formik.errors.name}>
                <Label>Tournament Name</Label>
                <Input
                  name="name"
                  placeholder="e.g. Round 5 | The Final Showdown"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                />
              </FormControl>

              <FormControl>
                <Label>Template (Optional)</Label>

                <Select
                  name="template"
                  value={formik.values.template}
                  onChange={formik.handleChange}
                >
                  <option>Select a template...</option>
                  {Object.entries(TOURNAMENT_TEMPLATES).map(([key]) => (
                    <option value={key}>{capitalCase(key)}</option>
                  ))}
                </Select>
              </FormControl>

              <Button
                type="submit"
                isLoading={formik.isSubmitting}
                disabled={formik.isSubmitting}
                mt={2}
              >
                Create Tournament
              </Button>
            </Flex>
          </form>
        </Box>
      </Box>
    </Center>
  );
};

export default Page;
