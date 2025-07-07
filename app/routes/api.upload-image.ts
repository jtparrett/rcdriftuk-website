import type { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { getAuth } from "~/utils/getAuth.server";
import { getUser } from "~/utils/getUser.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { uploadFile } from "~/utils/uploadFile.server";
import { userIsVerified } from "~/utils/userIsVerified";

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId);

  const user = await getUser(userId);

  notFoundInvariant(userIsVerified(user));

  const formData = await args.request.formData();
  const file = z.instanceof(File).parse(formData.get("file"));

  const url = await uploadFile(file);

  return { url };
};
