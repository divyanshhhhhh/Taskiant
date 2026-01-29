import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
    {
        variants: {
            variant: {
                default:
                    "bg-accent/20 text-accent",
                secondary:
                    "bg-background-tertiary text-text-secondary",
                destructive:
                    "bg-priority-1/20 text-priority-1",
                outline:
                    "border border-border text-text-secondary",
                priority1:
                    "bg-priority-1/20 text-priority-1",
                priority2:
                    "bg-priority-2/20 text-priority-2",
                priority3:
                    "bg-priority-3/20 text-priority-3",
                priority4:
                    "bg-priority-4/20 text-priority-4",
                success:
                    "bg-success/20 text-success",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

function Badge({ className, variant, ...props }) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
