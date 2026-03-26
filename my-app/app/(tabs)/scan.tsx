import { useEffect } from "react";
import { router, type Href } from "expo-router";

export default function ScanTabRedirect() {
  useEffect(() => {
    router.replace("/food-scan" as Href);
  }, []);

  return null;
}