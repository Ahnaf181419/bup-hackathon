import { ScenarioForm } from "@/features/optimize/components/ScenarioForm";
import { ClientOnly } from "@/features/shared/components/ClientOnly";

export const metadata = {
  title: "Scenario Optimizer — GridWise",
};

// The form restores its draft from sessionStorage on first render, so it mounts on the client only.
export default function OptimizePage() {
  return (
    <ClientOnly>
      <ScenarioForm />
    </ClientOnly>
  );
}
