import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

function Layout() {
  return (
    <main className="fullHeight flex text-black w-full">
      <div className="grow w-full">
        <Outlet />
        <Toaster richColors duration={500} />
      </div>
    </main>
  );
}

export default Layout;
