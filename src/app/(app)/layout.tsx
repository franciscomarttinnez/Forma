import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="relative min-h-screen md:pl-64">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-accent/[0.06] blur-3xl dark:bg-accent/[0.05]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent/[0.05] blur-3xl dark:bg-accent/[0.04]" />
      </div>
      <AppSidebar />
      <main className="relative mx-auto w-full max-w-3xl px-4 pb-28 pt-4 text-left sm:px-6 md:pb-16 md:pt-8">
        {children}
      </main>
    </div>
  );
}
