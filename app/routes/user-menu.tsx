import {
  Link,
  redirect,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import { UserMenu } from "~/components/Menu";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getUser } from "~/utils/getUser.server";
import notFoundInvariant from "~/utils/notFoundInvariant";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    throw redirect("/sign-in");
  }

  const user = await getUser(userId);

  notFoundInvariant(user);

  return { user };
};

const UserMenuPage = () => {
  const { user } = useLoaderData<typeof loader>();

  return (
    <Box>
      <Flex
        alignItems="center"
        gap={4}
        p={2}
        mx={2}
        my={4}
        bgColor="gray.800"
        rounded="xl"
      >
        <Link to={`/drivers/${user.driverId}`}>
          <styled.div
            w={14}
            h={14}
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
        </Link>

        <styled.h1 fontWeight="semibold">
          {user.firstName} {user.lastName}
        </styled.h1>
      </Flex>

      <UserMenu />
    </Box>
  );
};

export default UserMenuPage;
