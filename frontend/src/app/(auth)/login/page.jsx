import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata = {
  title: "Operator Login — GridWise",
};

export default function LoginPage() {
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
      <LoginForm />
    </div>
  );
}
