"use client"

import React, { type ComponentPropsWithoutRef, type CSSProperties } from "react"

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ")
}

export interface ShimmerButtonProps extends ComponentPropsWithoutRef<"button"> {
  shimmerColor?: string
  shimmerSize?: string
  borderRadius?: string
  shimmerDuration?: string
  background?: string
  className?: string
  children?: React.ReactNode
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = "#ffffff",
      shimmerSize = "0.05em",
      shimmerDuration = "3s",
      borderRadius = "8px",
      background = "rgba(0, 0, 0, 1)",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        style={
          {
            "--spread": "90deg",
            "--shimmer-color": shimmerColor,
            "--radius": borderRadius,
            "--speed": shimmerDuration,
            "--cut": shimmerSize,
            "--bg": background,
          } as CSSProperties
        }
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden border border-white/10 px-6 py-3 whitespace-nowrap text-white",
          "[border-radius:var(--radius)] [background:var(--bg)]",
          "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
          className
        )}
        ref={ref}
        {...props}
      >
        {/* spark container */}
        <div
          className="pointer-events-none absolute inset-0 -z-30 blur-[2px] overflow-visible"
          style={{ containerType: "size" } as CSSProperties}
        >
          <div
            className="animate-shimmer-slide absolute inset-0 rounded-none [mask:none]"
            style={{ aspectRatio: "1", height: "100cqh" } as CSSProperties}
          >
            <div
              className="animate-spin-around absolute -inset-full w-auto"
              style={{
                background: `conic-gradient(from calc(270deg - (var(--spread) * 0.5)), transparent 0, var(--shimmer-color) var(--spread), transparent var(--spread))`,
              }}
            />
          </div>
        </div>

        {children}

        {/* highlight layer */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 size-full",
            "rounded-2xl shadow-[inset_0_-8px_10px_#ffffff1f]",
            "transform-gpu transition-all duration-300 ease-in-out",
            "group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]",
            "group-active:shadow-[inset_0_-10px_10px_#ffffff3f]"
          )}
        />

        {/* backdrop — fills interior with the background color */}
        <div
          className="pointer-events-none absolute -z-20 [background:var(--bg)]"
          style={{
            inset: "var(--cut)",
            borderRadius: "var(--radius)",
          }}
        />
      </button>
    )
  }
)

ShimmerButton.displayName = "ShimmerButton"
