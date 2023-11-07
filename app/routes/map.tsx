import { Outlet } from "@remix-run/react";
import { MapHeader } from "~/components/MapHeader";

const Page = () => {
  return (
    <>
      <MapHeader />
      <Outlet />
    </>
  );
};

export default Page;
