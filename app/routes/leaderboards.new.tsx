import { useFormik } from "formik";
import { Button } from "~/components/Button";
import { FormControl } from "~/components/FormControl";
import { Glow } from "~/components/Glow";
import { Input } from "~/components/Input";
import { Label } from "~/components/Label";
import { Box, Center, Flex, styled } from "~/styled-system/jsx";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { redirect, useFetcher, type ActionFunctionArgs } from "react-router";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

const formSchema = z.object({
  name: z.string().min(1),
});

const validationSchema = toFormikValidationSchema(formSchema);

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  const formData = await args.request.formData();
  const name = z.string().min(1).parse(formData.get("name"));

  const leaderboard = await prisma.leaderboards.create({
    data: {
      userId,
      name,
    },
  });

  return redirect(`/leaderboards/${leaderboard.id}/edit`);
};

const LeaderboardsNewPage = () => {
  const fetcher = useFetcher();

  const formik = useFormik({
    initialValues: {
      name: "",
    },
    validationSchema,
    async onSubmit(values) {
      await fetcher.submit(values, {
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
            New Leaderboard
          </styled.h1>

          <form onSubmit={formik.handleSubmit}>
            <Flex gap={2} flexDir="column">
              <FormControl error={formik.errors.name}>
                <Label>Leaderboard Name</Label>
                <Input
                  name="name"
                  placeholder="e.g. 2025 Championship"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                />
              </FormControl>

              <Button
                type="submit"
                isLoading={formik.isSubmitting}
                disabled={formik.isSubmitting}
                mt={2}
              >
                Create Leaderboard
              </Button>
            </Flex>
          </form>
        </Box>
      </Box>
    </Center>
  );
};

export default LeaderboardsNewPage;
