import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Bell, Settings } from "lucide-react";

const items = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    title: "Users",
    icon: Users,
    href: "/admin/users",
  },
  {
    title: "Notifications",
    icon: Bell,
    href: "/admin/notifications", 
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/admin/settings",
  },
];

export default function AdminNav() {
  const [location] = useLocation();

  return (
    <div className="h-screen w-64 border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <span className="font-semibold">Admin Panel</span>
      </div>
      <div className="space-y-1 p-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                location === item.href && "bg-secondary",
              )}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
