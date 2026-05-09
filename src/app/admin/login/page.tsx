import { loginAction } from "../actions";

export default function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Girişi</h1>
          <p className="text-gray-400 text-sm mt-1">VAR? yönetim paneli</p>
        </div>
        <form action={loginAction} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Şifre</label>
            <input
              type="password"
              name="password"
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
}
