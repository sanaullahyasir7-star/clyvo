import { Suspense } from "react";
import { AppScreen } from "@/components/screens";
export function generateStaticParams() {
  return [
    "help",
    "auth",
    "onboarding",
    "dashboard",
    "live",
    "interview",
    "meetings",
    "memory",
    "search",
    "feedback",
    "history",
    "settings",
  ].map((section) => ({ section }));
}
export const dynamicParams = false;
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return (
    <Suspense fallback={<div className="center-page">Opening CLYVO…</div>}>
      <AppScreen section={section} />
    </Suspense>
  );
}
