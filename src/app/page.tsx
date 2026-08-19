import { AppNav } from "@/components/features/layout/app-nav";
import { TodayScreen } from "@/components/features/today/today-screen";

export default function Home() {
  return (
    <>
      <main className="flex-1 lg:pl-[216px]">
        <TodayScreen />
      </main>
      <AppNav />
    </>
  );
}
