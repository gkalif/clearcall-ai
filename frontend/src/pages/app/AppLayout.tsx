import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Home, Mic, MessageSquare, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Logo } from "../../components/shared";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/app/home", icon: Home, label: "Home" },
    { to: "/app/record", icon: Mic, label: "Record" },
    { to: "/app/messages", icon: MessageSquare, label: "Messages" },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-white shadow-xl relative">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00D1C9] to-[#5A00FF] flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-100 px-4 py-2 flex justify-around z-10">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
                isActive ? "text-[#00D1C9]" : "text-gray-400 hover:text-gray-600"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-xs font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
