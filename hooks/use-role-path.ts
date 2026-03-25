"use client";

import { useSession } from "next-auth/react";
import { useMemo, useCallback } from "react";

export function useRolePath() {
    const { data: session } = useSession() as any;

    const rolePrefix = useMemo(() => {
        const role = session?.user?.role as string | undefined;
        if (!role) return "";
        if (["ADMIN", "MANAGER", "SUPER_ADMIN"].includes(role)) return "/admin";
        if (role === "COUNSELOR") return "/counselor";
        if (["AGENT", "SALES_REP", "SUPPORT_AGENT"].includes(role)) return "/agent";
        if (role === "STUDENT") return "/student";
        return "";
    }, [session?.user?.role]);

    const prefixPath = useCallback((path: string) => {
        if (path.startsWith("http") || path.startsWith("mailto:") || path.startsWith("tel:")) return path;
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        return `${rolePrefix}${cleanPath}`;
    }, [rolePrefix]);

    return { rolePrefix, prefixPath };
}
