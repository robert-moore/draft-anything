'use client'

import type React from 'react'
import { useTheme } from 'next-themes'

export type LogoProps = React.ComponentProps<'svg'> & {
  theme?: 'light' | 'dark' | 'auto'
  background?: 'none' | 'rounded'
}

export function Logo({
  theme = 'auto',
  background = 'none',
  ...props
}: LogoProps) {
  const { resolvedTheme } = useTheme()
  
  // Determine actual theme to use
  const actualTheme = theme === 'auto' ? resolvedTheme : theme
  
  // Set colors
  const showBg = background === 'rounded'
  let pathFill = 'currentColor'
  
  if (showBg) {
    pathFill = actualTheme === 'dark' ? 'white' : '#101010'
  }

  if (showBg) {
    // Square version for rounded background
    // We'll use 824x824 as the square size (since original height is 824)
    // Center the path horizontally
    // The original path is 620 wide, so (824-620)/2 = 102 offset
    return (
      <svg
        viewBox="0 0 1268 1268"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <rect
          x="0"
          y="0"
          width="1268"
          height="1268"
          rx="256"
          ry="256"
          fill={actualTheme === 'light' ? 'white' : '#101010'}
        />
        <path
          d="M763.843 371.404L579.525 264.935L763.843 158.468L948.162 264.935L763.843 371.404ZM679.531 1022.44L679.341 1022.55C617.966 1058 541.245 1013.69 541.245 942.782C541.245 909.861 558.811 879.44 587.317 862.994L687.283 805.319V716.659L502.965 823.126L318.84 716.659L541.245 588.362V331.19L725.563 437.659V942.673C725.563 975.58 708.017 1005.99 679.531 1022.44ZM464.685 1102.32L280.56 995.85V783.106L464.685 889.574V1102.32ZM763.843 70L464.685 242.722V544.127L204 694.638V1040.09L502.965 1213L802.123 1040.09V490.837C802.123 457.93 819.67 427.524 848.154 411.069L848.344 410.96C909.721 375.506 986.442 419.821 986.442 490.726V490.918C986.442 523.841 968.876 554.26 940.368 570.708L840.402 628.383V716.851L1063 588.362V242.722L763.843 70Z"
          fill="#101010"
        />
      </svg>
    )
  }

  // Default: original aspect ratio
  return (
    <svg
      viewBox="0 0 620 824"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M404.01 217.285L271.071 140.531L404.01 63.7773L536.95 140.531L404.01 217.285ZM343.201 686.623L343.063 686.703C298.797 712.261 243.462 680.313 243.462 629.197C243.462 605.464 256.131 583.533 276.691 571.677L348.791 530.099V466.183L215.853 542.936L83.0526 466.183L243.462 373.692V188.295L376.401 265.049V629.119C376.401 652.841 363.746 674.761 343.201 686.623ZM188.243 744.209L55.4433 667.455V514.085L188.243 590.839V744.209ZM404.01 -1.19209e-05L188.243 124.517V341.803L0.224609 450.308V699.344L215.853 824L431.619 699.344V303.385C431.619 279.663 444.275 257.743 464.819 245.88L464.957 245.801C509.225 220.243 564.559 252.189 564.559 303.305V303.444C564.559 327.179 551.89 349.108 531.329 360.965L459.229 402.544V466.321L619.777 373.692V124.517L404.01 -1.19209e-05Z"
        fill={pathFill}
      />
    </svg>
  )
}
