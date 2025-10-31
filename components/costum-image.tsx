"use client"

import NextImage from "next/image"

// This is a wrapper component for Next.js Image
export default function CustomImage({
  src,
  alt,
  width,
  height,
  className,
}: {
  src: string
  alt: string
  width: number
  height: number
  className?: string
}) {
  return <NextImage src={src} alt={alt} width={width} height={height} className={className} />
}
