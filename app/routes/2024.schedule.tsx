import { Link, Outlet, useLocation } from "@remix-run/react";
import { Box, Center, Container, Flex, styled } from "~/styled-system/jsx";

interface Props {
  name: string;
  disabled?: boolean;
  to: string;
}

const LinkOverlay = styled(Link);

const Month = ({ name, disabled = false, to }: Props) => {
  const location = useLocation();

  return (
    <Box flex={1} pb={8} className="month" pos="relative" zIndex={1} maxW={120}>
      {!disabled && (
        <LinkOverlay
          to={to}
          pos="absolute"
          inset={0}
          zIndex={1}
          color="transparent"
        >
          2024 {name}
        </LinkOverlay>
      )}

      <Center h={100} w="full">
        {!disabled && (
          <Box
            className="dot"
            w={5}
            h={5}
            bgColor="gray.900"
            borderWidth={4}
            borderColor="brand-500"
            rounded="full"
            transition="all .3s"
            scale={location.pathname === to ? "150%" : "100%"}
          />
        )}
      </Center>
      <styled.h3
        textAlign="center"
        textTransform="uppercase"
        fontStyle="italic"
        fontWeight="bold"
        fontSize="sm"
        rotate="-45deg"
      >
        {name}
      </styled.h3>
    </Box>
  );
};

const Page = () => {
  return (
    <styled.main>
      <styled.h1 srOnly>RC Drift UK 2024 Championship</styled.h1>

      <Box bgColor="gray.900" pos="relative">
        <Box w="100vw" pos="absolute" h="1px" bgColor="brand-700" top="50px" />

        <Container>
          <Flex>
            <Month to="/2024/schedule/jan" name="Jan" />
            <Month to="/2024/schedule/feb" name="Feb" disabled />
            <Month to="/2024/schedule/mar" name="Mar" />
            <Month to="/2024/schedule/apr" name="Apr" />
            <Month to="/2024/schedule/may" name="May" />
            <Month to="/2024/schedule/jun" name="Jun" />
            <Month to="/2024/schedule/jul" name="Jul" />
            <Month to="/2024/schedule/aug" name="Aug" />
            <Month to="/2024/schedule/sep" name="Sep" />
          </Flex>
        </Container>
      </Box>

      <Container py={8}>
        <Outlet />
      </Container>
    </styled.main>
  );
};

export default Page;
