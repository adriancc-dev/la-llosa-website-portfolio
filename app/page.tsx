"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Calendar, Dumbbell, FishIcon as Swim } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ImageGallery } from "@/components/image-gallery"
import { LoginModal } from "@/components/login-modal"
import { useAuth } from "@/components/auth-provider"

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { isLoggedIn, isLoading } = useAuth()

  useEffect(() => {
    // Solo mostrar el modal de login si el usuario no está autenticado
    // y después de un pequeño retraso para mejor experiencia de usuario
    if (!isLoading && !isLoggedIn) {
      const timer = setTimeout(() => {
        setShowLoginModal(true)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isLoggedIn, isLoading])

  const handleLoginSuccess = () => {
    setShowLoginModal(false)
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  // Imágenes de ejemplo para la galería
  const heroImages = [
    {
      src: "/completo.jpg",
      alt: "Vista aérea de La Llosa",
      width: 800,
      height: 500,
    },
    {
      src: "/fronton1.jpg",
      alt: "Instalaciones deportivas",
      width: 800,
      height: 500,
    },
    {
      src: "/piscina.jpg",
      alt: "Piscina municipal",
      width: 800,
      height: 500,
    },
    {
      src: "/gimnasio.jpg",
      alt: "Gimnasio municipal",
      width: 800,
      height: 500,
    },
  ]

  // Sustituye la galería de instalaciones por imágenes reales
  const instalaciones = [
    { src: "/piscina2.jpg", alt: "Piscina para niños" },
    { src: "/fronton2.jpg", alt: "Frontón" },
    { src: "/futbol.jpg", alt: "Futbol" },
    { src: "/padel.jpg", alt: "Padel" },
    { src: "/gimnasio.jpg", alt: "Gimnasio" },
    { src: "/piscina.jpg", alt: "Piscina" },
    // Puedes añadir más imágenes aquí, por ejemplo:
    // { src: "/imagenes/tuimagen.jpg", alt: "Descripción" },
  ];

  return (
    <>
      {showLoginModal && !isLoggedIn && (
        <LoginModal onSuccess={handleLoginSuccess} onClose={() => setShowLoginModal(false)} />
      )}

      <div className="flex flex-col min-h-screen">
        {/* Hero Section */}
        <section className="py-12 md:py-20 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <motion.div className="order-2 md:order-1" initial="hidden" animate="visible" variants={fadeIn}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                  Servicios Deportivos de La Llosa
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-muted-foreground">
                  El Ayuntamiento de La Llosa promueve un futuro deportivo ofreciendo servicios a locales y visitantes.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="group relative overflow-hidden" asChild>
                    <Link href="/reservas-deportivas" className="flex items-center">
                      <span>Reservar Instalación</span>
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg">
                    <Link href="#servicios">Ver Servicios</Link>
                  </Button>
                </div>
              </motion.div>

              <motion.div className="order-1 md:order-2" initial="hidden" animate="visible" variants={fadeIn}>
                <ImageGallery images={heroImages} />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="servicios" className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Nuestros Servicios</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Disfruta de nuestras instalaciones deportivas con precios especiales para residentes locales.
              </p>
            </motion.div>

            <motion.div
              className="grid md:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {/* Deportes Card */}
              <motion.div variants={fadeIn}>
                <Card className="card-hover h-full border-none shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Reservas Deportivas</CardTitle>
                    <CardDescription>Pádel, Fútbol, Fútbol Sala y Frontón</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Reserva nuestras instalaciones deportivas con precios especiales para residentes locales.
                      Disponibilidad de luz para sesiones nocturnas.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full group" asChild>
                      <Link href="/reservas-deportivas" className="flex items-center justify-between">
                        <span>Reservar Ahora</span>
                        <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>

              {/* Gimnasio Card */}
              <motion.div variants={fadeIn}>
                <Card className="card-hover h-full border-none shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Dumbbell className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Gimnasio Municipal</CardTitle>
                    <CardDescription>Entradas diarias y bonos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Accede a nuestro gimnasio municipal con diferentes opciones: entrada diaria, bono mensual o bono
                      trimestral. Tarifas especiales para jubilados locales.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full group" asChild>
                      <Link href="/reservas-gimnasio" className="flex items-center justify-between">
                        <span>Ver Opciones</span>
                        <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>

              {/* Piscina Card */}
              <motion.div variants={fadeIn}>
                <Card className="card-hover h-full border-none shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Swim className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Piscina Municipal</CardTitle>
                    <CardDescription>Entradas, bonos y cursos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Disfruta de nuestra piscina municipal con diferentes opciones: entrada individual, bonos
                      mensuales, bonos de temporada y cursos de natación para todas las edades.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full group" asChild>
                      <Link href="/reservas-piscina" className="flex items-center justify-between">
                        <span>Más Información</span>
                        <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Nuestras Instalaciones</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Conoce las instalaciones deportivas municipales de La Llosa
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instalaciones.map((inst, idx) => (
                <motion.div
                  key={idx}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeIn}
                  className="overflow-hidden rounded-lg shadow-md group"
                >
                  <img
                    src={inst.src}
                    alt={inst.alt}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4">
            <motion.div
              className="max-w-3xl mx-auto text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl font-bold mb-4">¿Necesitas más información?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Estamos en La Llosa, Castellón, España. Contacta con nosotros para más información sobre nuestros
                servicios deportivos.
              </p>
              <Button size="lg" className="group" asChild>
                <Link href="/contacto" className="flex items-center">
                  <span>Contactar</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  )
}

