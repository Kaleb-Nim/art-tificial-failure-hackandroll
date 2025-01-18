import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

function Layout() {
  return (
    <main className="fullHeight bg-white dark:bg-[#080c15] flex dark:text-white text-black w-full">
      <div className="grow w-full">
        <Outlet />
        <Toaster richColors />
      </div>
    </main>
  );
}

export default Layout;
