"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            position="top-center"
            expand={false}
            duration={5000}
            closeButton
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-none group-[.toaster]:shadow-[0_8px_30px_rgb(0,0,0,0.12)] group-[.toaster]:rounded-lg group-[.toaster]:p-4 group-[.toaster]:pl-6 group-[.toaster]:flex group-[.toaster]:items-center group-[.toaster]:gap-4 group-[.toaster]:relative",
                    title: "group-[.toast]:text-sm group-[.toast]:font-bold group-[.toast]:text-slate-900",
                    description: "group-[.toast]:text-xs group-[.toast]:text-slate-500 group-[.toast]:mt-1",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg",
                    cancelButton:
                        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
                    success: "group-[.toaster]:success-toast",
                    error: "group-[.toaster]:error-toast",
                    warning: "group-[.toaster]:warning-toast",
                    info: "group-[.toaster]:info-toast",
                    closeButton: "group-[.toast]:!bg-transparent group-[.toast]:!border-none group-[.toast]:!text-slate-300 group-[.toast]:hover:!text-slate-500",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
