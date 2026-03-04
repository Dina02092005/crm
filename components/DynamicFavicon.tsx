"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function DynamicFavicon() {
    const { data: session } = useSession() as any;
    const pathname = usePathname();

    useEffect(() => {
        const role = session?.user?.role;
        const isAgentOrCounselor = ["AGENT", "COUNSELOR", "SALES_REP", "SUPPORT_AGENT"].includes(role);

        const searchParams = new URLSearchParams(window.location.search);
        const typeParam = searchParams.get("type");
        const isAgentPath = pathname.includes("/agent/") || pathname.includes("/counselor/") || typeParam === "agent" || typeParam === "counselor";

        const favicon = (isAgentOrCounselor || isAgentPath)
            ? "/logos/Icon%20Colour.png"
            : "/logos/intered-circle.png";

        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.getElementsByTagName("head")[0].appendChild(link);
        }
        link.href = favicon;
    }, [session, pathname]);

    return null;
}
