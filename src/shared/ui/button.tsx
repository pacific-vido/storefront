import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const buttonVariants = cva(
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:cursor-default disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "border border-border bg-card text-foreground shadow-sm hover:bg-secondary",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        danger: "bg-destructive text-white hover:bg-destructive/90",
        ghost: "text-foreground hover:bg-secondary",
        outline: "border border-border bg-background text-foreground hover:bg-secondary",
      },
      size: {
        default: "h-11 px-4",
        icon: "size-11 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  type = "button",
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
      type={asChild ? undefined : type}
    />
  );
}

export { Button, buttonVariants };
