"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/",          label: "Adalet Tablosu" },
  { href: "/incidents", label: "Olaylar" },
  { href: "/referees",  label: "Hakemler" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          VAR?<span className="text-red-500 ml-1">⚽</span>
        </Link>
        <div className="flex gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/admin"
            className="ml-4 px-3 py-1.5 rounded-md text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}
