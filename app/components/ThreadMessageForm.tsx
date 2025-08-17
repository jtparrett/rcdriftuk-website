import { useFormik } from "formik";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { RiSendPlaneFill } from "react-icons/ri";
import { UserTaggingInput } from "./UserTaggingInput";
import { toFormikValidationSchema } from "zod-formik-adapter";
import z from "zod";
import { Button } from "./Button";
import type { GetUser } from "~/utils/getUser.server";

const formSchema = z.object({
  content: z.string().min(1),
});

const validationSchema = toFormikValidationSchema(formSchema);

interface Props {
  user: GetUser;
}

export const ThreadMessageForm = ({ user }: Props) => {
  const formik = useFormik({
    validationSchema,
    initialValues: {
      content: "",
    },
    onSubmit(values) {
      formik.resetForm();
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} id="comment">
      <Flex gap={2} alignItems="flex-end">
        <Box
          w={10}
          h={10}
          rounded="full"
          overflow="hidden"
          borderWidth={1}
          borderColor="gray.700"
        >
          <styled.img
            w="full"
            h="full"
            src={user?.image ?? "/blank-driver-right.jpg"}
            objectFit="cover"
          />
        </Box>
        <Box
          flex={1}
          bgColor="gray.800"
          rounded="xl"
          borderWidth={1}
          borderColor="gray.700"
        >
          <UserTaggingInput
            placeholder="Send a message..."
            name="content"
            value={formik.values.content}
            onChange={(value) => formik.setFieldValue("content", value)}
            rounded="xl"
            placement="top"
          />
        </Box>

        {formik.isValid && (
          <Button px={0} py={0} w={8} h={8} mb={1.5} type="submit">
            <RiSendPlaneFill size={16} />
          </Button>
        )}
      </Flex>
    </form>
  );
};
