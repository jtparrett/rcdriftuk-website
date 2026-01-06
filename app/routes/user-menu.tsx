import {
  RiArrowRightLine,
  RiAwardLine,
  RiCameraLensLine,
  RiFlagLine,
  RiGamepadLine,
  RiRocketLine,
  RiTrophyLine,
} from "react-icons/ri";
import {
  Link,
  redirect,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import { LinkOverlay } from "~/components/LinkOverlay";
import { MenuIcon, MenuLink, UserMenu } from "~/components/Menu";
import { UserTracks } from "~/components/UserTracks";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getUser } from "~/utils/getUser.server";
import notFoundInvariant from "~/utils/notFoundInvariant";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    throw redirect("/sign-in?redirect=/user-menu");
  }

  const user = await getUser(userId);

  notFoundInvariant(user, "User not found");

  return { user };
};

const UserMenuPage = () => {
  const { user } = useLoaderData<typeof loader>();

  return (
    <Box p={2}>
      <Flex
        alignItems="center"
        gap={4}
        py={3}
        px={4}
        bgColor="gray.900"
        rounded="xl"
        borderWidth={1}
        borderColor="gray.800"
        pos="relative"
        overflow="hidden"
      >
        <LinkOverlay to={`/drivers/${user.driverId}`}>
          <styled.div
            w={10}
            h={10}
            rounded="full"
            overflow="hidden"
            borderWidth={1}
            borderColor="gray.800"
          >
            <styled.img
              src={user.image ?? "/blank-driver-right.jpg"}
              w="full"
              h="full"
              objectFit="cover"
            />
          </styled.div>
        </LinkOverlay>

        <styled.h1 fontWeight="semibold">
          {user.firstName} {user.lastName}
        </styled.h1>
      </Flex>

      <UserTracks user={user} />

      <Box h={4} />

      <MenuLink to="/getting-started">
        <MenuIcon>
          <RiRocketLine />
        </MenuIcon>
        Getting Started
      </MenuLink>

      <MenuLink to="/tracks">
        <MenuIcon>
          <RiFlagLine />
        </MenuIcon>
        Find Tracks
      </MenuLink>

      <MenuLink to="/competitions">
        <MenuIcon>
          <RiTrophyLine />
        </MenuIcon>
        Competitions
      </MenuLink>

      <MenuLink to="/leaderboards">
        <MenuIcon>
          <RiAwardLine />
        </MenuIcon>
        Leaderboards
      </MenuLink>

      <UserMenu />

      <MenuLink to="/vtrack">
        <MenuIcon>
          <RiGamepadLine />
        </MenuIcon>
        Let's Skid!
      </MenuLink>
    </Box>
  );
};

export default UserMenuPage;
