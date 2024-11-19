export default function notFoundInvariant(condition: any): asserts condition {
  if (condition) {
    return;
  }

  throw new Response(null, {
    status: 404,
    statusText: "Not Found",
  });
}
