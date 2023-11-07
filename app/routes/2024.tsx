import { Link } from "@remix-run/react";
import { ChampHeader } from "~/components/ChampHeader";
import { Box, Center, Container, Flex, styled } from "~/styled-system/jsx";

interface Props {
  name: string;
  isActive?: boolean;
  disabled?: boolean;
  to: string;
}

const LinkOverlay = styled(Link);

const Month = ({ name, isActive = false, disabled = false, to }: Props) => {
  return (
    <Box flex={1} pb={8} className="month" pos="relative" zIndex={1}>
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
            scale={isActive ? "150%" : "100%"}
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
    <>
      <ChampHeader />
      <styled.main>
        <styled.h1 srOnly>RC Drift UK 2024 Championship</styled.h1>

        <Box bgColor="gray.900" pos="relative">
          <Box
            w="100vw"
            pos="absolute"
            h="1px"
            bgColor="brand-700"
            top="50px"
          />

          <Container>
            <Flex>
              <Month to="/2024/Jan" name="Jan" isActive />
              <Month to="/2024/Feb" name="Feb" disabled />
              <Month to="/2024/Mar" name="Mar" />
              <Month to="/2024/Apr" name="Apr" />
              <Month to="/2024/May" name="May" />
              <Month to="/2024/Jun" name="Jun" />
              <Month to="/2024/Jul" name="Jul" />
              <Month to="/2024/Aug" name="Aug" />
              <Month to="/2024/Sep" name="Sep" />
              <Month to="/2024/Oct" name="Oct" disabled />
              <Month to="/2024/Nov" name="Nov" disabled />
              <Month to="/2024/Dec" name="Dec" disabled />
            </Flex>
          </Container>
        </Box>
      </styled.main>
    </>
  );
};

export default Page;
