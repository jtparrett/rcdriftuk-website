import { useClerk } from "@clerk/react-router";
import { useEffect } from "react";

const SignOutPage = () => {
  const { signOut } = useClerk();

  useEffect(() => {
    signOut({
      redirectUrl: "/sign-in",
    });
  }, []);

  return null;
};

export default SignOutPage;
