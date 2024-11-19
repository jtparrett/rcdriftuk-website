import { UserProfile } from "@clerk/remix";
import { Box } from "~/styled-system/jsx";

const UserProfilePage = () => {
  return (
    <Box py={10}>
      <UserProfile />
    </Box>
  );
};

export default UserProfilePage;
