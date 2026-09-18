import { SignupForm } from "@/features/auth/components/SignupForm";

export const metadata = {
  title: "Create Operator Account — GridWise",
};

export default function SignupPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 50% 20%, #172436 0%, #080c11 70%)",
        padding: "20px",
      }}
    >
      <SignupForm />
    </div>
  );
}
