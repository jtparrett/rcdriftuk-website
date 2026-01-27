import { getAuth as getAuthClerk } from "@clerk/react-router/server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

const generateNewRequestForClerk = (request: Request) => {
  const originalRequest = request.clone();
  const newRequestInit = {
    method: "GET", // Change the method to GET
    headers: new Headers(originalRequest.headers), // Copy headers from the original request
  };

  // Remove content-type header as it's not needed for GET and may cause issues
  newRequestInit.headers.delete("Content-Type");

  // Instantiate the new request without the body attribute
  return new Request(originalRequest.url, newRequestInit);
};

export const getAuth = (args: LoaderFunctionArgs | ActionFunctionArgs) =>
  getAuthClerk({
    ...args,
    request: generateNewRequestForClerk(args.request),
  });
