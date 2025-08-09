import Ably from "ably";
import invariant from "~/utils/invariant";

export const loader = async () => {
  invariant(process.env.ABLY_API_KEY, "ABLY_API_KEY must be set");

  const ably = new Ably.Rest(process.env.ABLY_API_KEY);

  try {
    const tokenRequest = await ably.auth.createTokenRequest({
      capability: { "*": ["publish", "subscribe", "presence"] },
    });
    return tokenRequest;
  } catch (error) {
    console.error("Error generating token request:", error);
    throw new Response(
      JSON.stringify({ error: "Failed to generate token request" }),
      { status: 500 },
    );
  }
};
