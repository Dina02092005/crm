import type { ReactNode } from "react";

/**
 * Auth layout: Form positioned inside the illustration container.
 * Desktop/Tablet: Equal spacing around illustration with dark green background visible.
 * Mobile: Full-screen illustration background with no outer spacing.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a2e1a]">
      {/* Container with padding for desktop/tablet, no padding for mobile */}
      <div className="relative min-h-screen p-0 sm:p-8">
        {/* Background illustration container */}
        <div
          className="relative min-h-screen sm:min-h-[calc(100vh-4rem)] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400 via-blue-500 to-indigo-900 flex items-center justify-end px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 rounded-3xl overflow-hidden"
        >
          {/* Abstract Shapes */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-3xl" />
            <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] rounded-full bg-indigo-500/20 blur-2xl" />
          </div>
          <div className="relative z-10 w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
