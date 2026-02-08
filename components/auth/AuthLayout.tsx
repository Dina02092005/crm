import type { ReactNode } from "react";

/**
 * Auth layout: Form positioned inside the illustration container.
 * Desktop/Tablet: Equal spacing around illustration with dark green background visible.
 * Mobile: Full-screen illustration background with no outer spacing.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f766e]">
      {/* Container with padding for desktop/tablet, no padding for mobile */}
      <div className="relative min-h-screen p-0 sm:p-8">
        {/* Background illustration container */}
        <div
          className="relative min-h-screen sm:min-h-[calc(100vh-4rem)] bg-[url('/images/auth-bg.png')] bg-cover bg-center flex items-center justify-end px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-black/10 z-0 pointer-events-none" />
          <div className="relative z-10 w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
