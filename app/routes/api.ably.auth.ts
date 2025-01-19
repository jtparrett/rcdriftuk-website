import Ably from "ably";

export const loader = async () => {
  const ably = new Ably.Realtime({ key: process.env.ABLY_API_KEY });

  try {
    const tokenRequest = await ably.auth.createTokenRequest();
    return tokenRequest;
  } catch (error) {
    console.error("Error generating token request:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate token request" }),
      { status: 500 }
    );
  }
};
