import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { userPrefs } from "~/utils/cookiePolicy.server";

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  const cookieHeader = request.headers.get("Cookie");
  const cookie = (await userPrefs.parse(cookieHeader)) || {};

  cookie.hideBanner = true;

  return redirect(request.headers.get("Referer") ?? "/", {
    headers: {
      "Set-Cookie": await userPrefs.serialize(cookie),
    },
  });
}
