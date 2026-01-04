import { Form, useNavigate } from "react-router";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { Button, LinkButton } from "./Button";
import { appGoBack } from "~/utils/appGoBack";

interface Props {
  title: string;
  disclaimer?: string;
  confirmText: string;
}

export const ConfirmationForm = ({ title, disclaimer, confirmText }: Props) => {
  const navigate = useNavigate();
  return (
    <Box
      bg="gray.900"
      p={8}
      borderRadius="2xl"
      mx="auto"
      maxW={500}
      textAlign="center"
      borderWidth={1}
      borderColor="gray.800"
    >
      <Form method="post">
        <styled.h1 mb={2} fontWeight="medium" fontSize="2xl" lineHeight="1.2">
          {title}
        </styled.h1>
        {disclaimer && (
          <styled.p
            color="brand.500"
            fontWeight="medium"
            mb={2}
            whiteSpace="pre-line"
          >
            {disclaimer}
          </styled.p>
        )}
        <Flex
          gap={2}
          justifyContent="center"
          mt={6}
          flexDir={{ base: "column", sm: "row" }}
        >
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              const wentBack = appGoBack();
              if (!wentBack) {
                navigate(-1);
              }
            }}
          >
            Cancel
          </Button>
          <Button type="submit">{confirmText}</Button>
        </Flex>
      </Form>
    </Box>
  );
};
