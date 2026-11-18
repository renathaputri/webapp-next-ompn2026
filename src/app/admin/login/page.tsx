import { AdminLoginForm } from "./admin-login-form";

export const metadata = {
  title: "Login Administrator - OMPN 2026",
  description: "Portal masuk khusus administrator OMPN 2026",
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <span className="text-2xl font-bold tracking-tight text-white">OMPN</span>
          <span className="text-2xl font-bold tracking-tight text-[#C9A227]">2026</span>
        </div>
        <AdminLoginForm />
      </div>
    </div>
  );
}
