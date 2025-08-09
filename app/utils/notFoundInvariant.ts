export default function notFoundInvariant(
  condition: any,
  message: string,
): asserts condition {
  if (condition) {
    return;
  }

  console.log("Not Found Invariant", condition, message);

  throw new Response(null, {
    status: 404,
    statusText: "Not Found",
  });
}
