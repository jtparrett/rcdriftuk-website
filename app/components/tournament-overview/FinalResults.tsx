import { AspectRatio, Center, Flex, styled } from "~/styled-system/jsx";
import { getRankColor, RANKS } from "~/utils/getDriverRank";
import { RiTrophyLine } from "react-icons/ri";
import { LinkOverlay } from "~/components/LinkOverlay";

interface Driver {
  id: number;
  user: {
    firstName: string | null;
    lastName: string | null;
    image: string | null;
    driverId: number;
  };
}

export const FinalResults = ({ drivers }: { drivers: Driver[] }) => {
  const results = drivers.slice(0, 3);

  return (
    <Flex w={700} maxW="full" flexDir="column" gap={2} p={2} textAlign="left">
      {results.map((driver) => {
        const i = results.indexOf(driver);
        const [bgColor] =
          i === 0
            ? getRankColor(RANKS.GOLD)
            : i === 1
              ? getRankColor(RANKS.SILVER)
              : getRankColor(RANKS.BRONZE);

        return (
          <Flex
            key={driver.id}
            overflow="hidden"
            style={
              {
                "--bg": bgColor,
                "--ml": i === 0 ? 0 : i === 1 ? "12px" : "24px",
              } as React.CSSProperties
            }
            bgColor="var(--bg)"
            ml="var(--ml)"
            rounded="xl"
            pos="relative"
            zIndex={1}
            _after={{
              content: '""',
              pos: "absolute",
              inset: 0,
              pointerEvents: "none",
              bgGradient: "to-b",
              gradientFrom: "rgba(0, 0, 0, 0)",
              gradientTo: "rgba(0, 0, 0, 0.4)",
              zIndex: -1,
            }}
            shadow="inset 0 1px 0 rgba(255, 255, 255, 0.3)"
          >
            <AspectRatio ratio={1} w="78px" overflow="hidden" flex="none">
              <styled.img
                src={driver?.user.image ?? "/blank-driver-right.jpg"}
                alt={driver?.user.firstName ?? ""}
              />
            </AspectRatio>

            <LinkOverlay
              to={`/drivers/${driver.user.driverId}`}
              fontWeight="extrabold"
              fontSize={{ base: "lg", md: "xl" }}
              textTransform="uppercase"
              fontStyle="italic"
              alignSelf="center"
              lineHeight={1.1}
              p={{ base: 4, md: 6 }}
              textShadow="1px 1px 2px rgba(0, 0, 0, 0.5)"
              flex={1}
              overflow="hidden"
            >
              <styled.span
                display="block"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                overflow="hidden"
                maxW="100%"
              >
                {driver?.user.firstName}
              </styled.span>{" "}
              <styled.span
                display="block"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                overflow="hidden"
                maxW="100%"
              >
                {driver?.user.lastName}
              </styled.span>
            </LinkOverlay>

            <Center
              w={24}
              bgColor="rgba(0, 0, 0, 0.4)"
              flexDir="column"
              shadow="inset 2px 0 6px rgba(0, 0, 0, 0.3)"
              gap={0.5}
              flex="none"
            >
              <RiTrophyLine size={24} />
              <styled.span fontWeight="extrabold">
                {i === 0 ? "1ST" : i === 1 ? "2ND" : "3RD"}
              </styled.span>
            </Center>
          </Flex>
        );
      })}
    </Flex>
  );
};
