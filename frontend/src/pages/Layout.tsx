import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

function Layout() {
  return (
    <main className="fullHeight flex text-black w-full">
      <div className="grow w-full">
        <Outlet />
        <Toaster richColors />
      </div>
    </main>
  );
}

export default Layout;
