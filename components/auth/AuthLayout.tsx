"use client";

import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Auth layout: Premium split-screen design.
 * Desktop: 52/48 split with gradient/patterned left panel.
 * Mobile: Form centered with logo.
 */
export function AuthLayout({ children, loginType = "student" }: { children: ReactNode, loginType?: "student" | "admin" | "agent" | "counselor" }) {

  // Role-specific configurations
  const roleConfigs = {
    admin: {
      brandName: "InterEd",
      tagline: "Your Bridge to Global Education",
      gradient: "from-[#020617] via-[#1e1b4b] to-[#312e81]",
      accent: "#818cf8",
      heading: (
        <>Manage with<br /><em>clarity</em><br />and control.</>
      ),
      subHeading: "Access the InterEd admin dashboard to manage students, counselors, applications and institutional data.",
      features: [
        "Student & application management",
        "Counselor performance tracking",
        "Office-wise reporting & analytics",
        "System configuration & user roles"
      ],
      badge: "Admin Portal",
      badgeIcon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3 h-3">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    },
    student: {
      brandName: "InterEd",
      tagline: "Your Bridge to Global Education",
      gradient: "from-[#064e3b] via-[#065f46] to-[#059669]",
      accent: "#34d399",
      heading: (
        <>Begin your<br /><em>global</em><br />journey today.</>
      ),
      subHeading: "Join thousands of students who found their path to international education with expert guidance and personalised support.",
      features: [
        "Access 1,200+ courses worldwide",
        "Personal education counselor assigned",
        "End-to-end visa & admission support",
        "Scholarship matching & financial guidance"
      ],
      badge: "Student Portal",
      badgeIcon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3 h-3">
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      )
    },
    agent: {
      brandName: "InterWise",
      tagline: "Your Study Abroad Recruitment Partner",
      gradient: "from-[#1e3a8a] via-[#2563eb] to-[#3b82f6]",
      accent: "#93c5fd",
      heading: (
        <>Recruit students,<br />grow your <em>global</em><br />network.</>
      ),
      subHeading: "Sign in to your agent portal to manage student applications, track enrollments, and connect students to top universities worldwide.",
      features: [
        "Submit & track student applications",
        "Manage visa & offer letter progress",
        "Earn commissions & monitor payouts"
      ],
      badge: "Agent Portal",
      badgeIcon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3 h-3">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    counselor: {
      brandName: "InterEd",
      tagline: "Your Bridge to Global Education",
      gradient: "from-[#312e81] via-[#4c1d95] to-[#7c3aed]",
      accent: "#a78bfa",
      heading: (
        <>Guide students,<br />shape their <em>academic</em><br />futures.</>
      ),
      subHeading: "Sign in to your counselor portal to mentor students and manage application timelines seamlessly.",
      features: [
        "Mentor student progress",
        "Manage application timelines",
        "Track student success rates"
      ],
      badge: "Counselor Portal",
      badgeIcon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3 h-3">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      )
    }
  };

  const config = roleConfigs[loginType];

  return (
    <div className="min-h-screen flex font-sans bg-[#F9FAFB] overflow-hidden">
      {/* ─── LEFT PANEL (Hidden on mobile) ─── */}
      <div className={`hidden lg:flex relative w-[52%] bg-gradient-to-br ${config.gradient} flex-col justify-between p-12 overflow-hidden`} style={{ "--accent-color": config.accent } as any}>
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.08]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
        />

        {/* Arcs/Shapes */}
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 border-2 border-white/15 rounded-full pointer-events-none">
          <div className="absolute inset-8 border-2 border-white/10 rounded-full" />
        </div>

        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-40 -left-12 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float-slow delay-1000" />

        {/* Brand */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 border border-white/40 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M4 18 Q12 6 20 18" />
                <line x1="4" y1="18" x2="4" y2="14" />
                <line x1="20" y1="18" x2="20" y2="14" />
                <line x1="12" y1="11" x2="12" y2="18" />
              </svg>
            </div>
            <div>
              <div className="text-white text-2xl font-bold tracking-tight">{config.brandName}</div>
              <div className="text-white/60 text-[10px] uppercase tracking-wider font-medium">{config.tagline}</div>
            </div>
          </Link>
        </div>

        {/* Copy */}
        <div className="relative z-10">
          <h1 className="text-white text-5xl font-serif font-semibold leading-[1.15] mb-6 tracking-tight">
            {config.heading}
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-sm">
            {config.subHeading}
          </p>
        </div>

        {/* Features */}
        <ul className="relative z-10 flex flex-col gap-3">
          {config.features.map((feature, i: number) => (
            <li key={i} className="flex items-center gap-3 text-white/80 text-sm">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.accent }} />
              {feature}
            </li>
          ))}
        </ul>

        {/* Agent specific powered by */}
        {loginType === "agent" && (
          <div className="relative z-10 flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest font-semibold mt-8">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="opacity-50">
              <path d="M4 18 Q12 6 20 18" /><line x1="4" y1="18" x2="4" y2="14" />
              <line x1="20" y1="18" x2="20" y2="14" /><line x1="12" y1="11" x2="12" y2="18" />
            </svg>
            Powered by InterEd
            <span className="w-px h-3 bg-white/20 mx-1" />
            Study Abroad Specialists
          </div>
        )}
      </div>

      {/* ─── RIGHT PANEL (Form) ─── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-[420px]">

          {/* Role Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-6 text-[10px] font-bold uppercase tracking-widest ${loginType === 'admin' ? 'bg-indigo-100/50 border-indigo-200 text-indigo-800' :
            loginType === 'agent' ? 'bg-sky-100/50 border-sky-200 text-sky-800' :
              loginType === 'counselor' ? 'bg-purple-100/50 border-purple-200 text-purple-800' :
                'bg-emerald-100/50 border-emerald-200 text-emerald-800'
            }`}>
            {config.badgeIcon}
            {config.badge}
          </div>

          {children}

          <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-gray-400 font-medium">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Secured with 256-bit SSL encryption
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+Pro:wght@400;600;700&display=swap');
        
        .font-serif { font-family: 'Source Serif Pro', serif; }
        .font-serif em { font-style: italic; color: var(--accent-color, #4FD1C5); font-weight: normal; }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
