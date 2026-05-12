import { Suspense } from "react";
import App from "@/components/App";
import { AppSkeleton } from "@/components/Skeletons";

export default function Home() {
  return (
    <Suspense fallback={<AppSkeleton />}>
      <App />
    </Suspense>
  );
}
