import { ChangePasswordForm } from "./change-password-form";

export const metadata = {
  title: "Ganti Kata Sandi - OMPN 2026",
};

export default function GantiPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
