import { notFound } from "next/navigation";
import { Providers } from "@/components/providers";
import DesignPreview from "./preview";

export const metadata = { title: "Design system · Syncfolio" };

/** Living reference for the UI primitives. Development only. */
export default function DesignPage() {
  if (process.env.NODE_ENV === "production" && process.env.SYNCFOLIO_SHOW_DESIGN !== "1") notFound();
  return (
    <Providers>
      <DesignPreview />
    </Providers>
  );
}
