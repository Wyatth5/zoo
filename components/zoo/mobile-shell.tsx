import Link from "next/link";
import { Home, Plus, User, Users } from "lucide-react";

export function MobileShell({
  children,
  activeTab,
}: {
  children: React.ReactNode;
  activeTab: "feed" | "create" | "crew" | "profile";
}) {
  return (
    <main className="min-h-screen bg-[#09090f] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col border-x border-white/10 bg-gradient-to-b from-[#111122] via-[#09090f] to-black">
        <section className="flex-1 pb-32">{children}</section>

        <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto grid w-full max-w-md grid-cols-4 border-t border-white/10 bg-black/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl">
          <NavItem href="/feed" icon={<Home />} label="Feed" active={activeTab === "feed"} />
          <NavItem href="/create" icon={<Plus />} label="Post" active={activeTab === "create"} />
          <NavItem href="/crew" icon={<Users />} label="Crew" active={activeTab === "crew"} />
          <NavItem href="/profile" icon={<User />} label="Profile" active={activeTab === "profile"} />
        </nav>
      </div>
    </main>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 text-xs ${
        active ? "text-fuchsia-300" : "text-white/40"
      }`}
    >
      <div className="h-5 w-5">{icon}</div>
      <span>{label}</span>
    </Link>
  );
}
