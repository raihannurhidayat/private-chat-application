import Homepage from "@/views/homepage";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <Suspense>
      <Homepage />
    </Suspense>
  );
}
