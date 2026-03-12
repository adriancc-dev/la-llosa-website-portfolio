"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type ImageGalleryProps = {
  images: {
    src: string
    alt: string
    width: number
    height: number
  }[]
  className?: string
}

export function ImageGallery({ images, className = "" }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      prevImage()
    } else if (e.key === "ArrowRight") {
      nextImage()
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`} onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Imagen principal */}
      <div className="relative aspect-video overflow-hidden rounded-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full"
          >
            <Image
              src={images[currentIndex].src || "/placeholder.svg"}
              alt={images[currentIndex].alt}
              width={images[currentIndex].width}
              height={images[currentIndex].height}
              className="h-full w-full object-cover"
            />

            {/* Controles de navegación */}
            <div className="absolute inset-0 flex items-center justify-between p-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                onClick={prevImage}
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Imagen anterior</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                onClick={nextImage}
              >
                <ChevronRight className="h-5 w-5" />
                <span className="sr-only">Imagen siguiente</span>
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Miniaturas */}
      <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <button
            key={index}
            className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-md transition-all ${
              index === currentIndex ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
            }`}
            onClick={() => setCurrentIndex(index)}
          >
            <Image
              src={image.src || "/placeholder.svg"}
              alt={`Miniatura ${index + 1}`}
              width={96}
              height={64}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

