import { useEffect } from "react";

export const Advert = () => {
  useEffect(() => {
    try {
      // @ts-ignore
      (global.window.adsbygoogle = global.window.adsbygoogle || []).push({});
    } catch (err) {
      console.log(err);
    }
  }, []);

  return (
    <div className="gad">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-8123266196289449"
        data-ad-slot="2951390296"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};
