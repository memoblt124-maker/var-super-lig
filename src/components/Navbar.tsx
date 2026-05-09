"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const links = [
  { href: "/",          label: "Adalet Tablosu" },
  { href: "/incidents", label: "Olaylar" },
  { href: "/referees",  label: "Hakemler" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-50 border-b border-[#252a35] bg-[#0e1015]/95 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image src="/logo.svg" alt="VAR" width={32} height={32} />
          <span className="font-black text-white tracking-tight text-lg leading-none">
            VAR<span className="text-red-500">?</span>
          </span>
          <span className="hidden sm:block text-[11px] text-[#6b7280] font-medium border border-[#252a35] rounded px-1.5 py-0.5">
            Süper Lig
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-0.5">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "text-white bg-[#252a35]"
                    : "text-[#6b7280] hover:text-white hover:bg-[#1a1f2a]"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <Link
            href="/admin"
            className="ml-3 px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}
