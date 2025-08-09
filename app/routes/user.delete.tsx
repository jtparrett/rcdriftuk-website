import { redirect, type ActionFunctionArgs } from "react-router";
import { ConfirmationForm } from "~/components/ConfirmationForm";
import { Container } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  await prisma.users.update({
    where: {
      id: userId,
    },
    data: {
      archived: true,
    },
  });

  return redirect("/sign-out");
};

const UserDeletePage = () => {
  return (
    <Container maxW={1100} px={2} py={10}>
      <form>
        <ConfirmationForm
          title="Are you sure you want to delete your account?"
          disclaimer="The request will be processed within 24 hours, and cannot be undone."
          confirmText="Delete My Account"
        />
      </form>
    </Container>
  );
};

export default UserDeletePage;
