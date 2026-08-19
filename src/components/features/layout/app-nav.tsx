import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Bugün", icon: "today", href: "/" },
  { label: "İşler", icon: "handyman", href: "/isler" },
  { label: "Teklif", icon: "request_quote", href: "/teklif" },
  { label: "Müşteriler", icon: "groups", href: "/musteriler" },
  { label: "Defter", icon: "menu_book", href: "/defter" },
];

interface AppNavProps {
  activeHref?: string;
}

export function AppNav({ activeHref = "/" }: AppNavProps) {
  return (
    <>
      <nav
        aria-label="Ana menü"
        className="fixed inset-x-0 bottom-0 z-50 border-t bg-surface lg:hidden"
      >
        <div className="mx-auto flex h-[calc(64px+env(safe-area-inset-bottom))] max-w-[600px] items-stretch pb-[env(safe-area-inset-bottom)]">
          {navItems.map((item) => {
            const active = item.href === activeHref;
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1",
                  active ? "text-primary" : "text-muted",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "material-symbols-outlined text-2xl",
                    active && "icon-filled",
                  )}
                >
                  {item.icon}
                </span>
                <span
                  className={cn(
                    "text-[10px]",
                    active ? "font-semibold" : "font-medium",
                  )}
                >
                  {item.label}
                </span>
              </a>
            );
          })}
        </div>
      </nav>
      <nav
        aria-label="Ana menü"
        className="fixed inset-y-0 left-0 z-40 hidden w-[216px] flex-col gap-1 border-r bg-surface p-3 lg:flex"
      >
        {navItems.map((item) => {
          const active = item.href === activeHref;
          return (
            <a
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-control px-3 text-sm font-semibold",
                active
                  ? "bg-primary-soft text-primary"
                  : "text-muted hover:bg-surface-sunken hover:text-ink",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "material-symbols-outlined text-xl",
                  active && "icon-filled",
                )}
              >
                {item.icon}
              </span>
              {item.label}
            </a>
          );
        })}
      </nav>
    </>
  );
}
