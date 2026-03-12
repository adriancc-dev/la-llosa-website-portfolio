"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/components/auth-provider"
import { LoginModal } from "@/components/login-modal"
import { Menu, X, User, LogOut, Home, Calendar, Dumbbell, CreditCard, PocketIcon as Pool } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile" // Corregido: useMobile -> useIsMobile
import { motion, AnimatePresence } from "framer-motion"

// Definir las props para LoginModal si no están definidas
interface LoginModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const pathname = usePathname()
  const isMobile = useIsMobile() // Usando useIsMobile en lugar de useMobile
  const { isLoggedIn, logout, user } = useAuth()

  // Cerrar el menú móvil cuando cambia la ruta
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Cerrar el menú móvil cuando se cambia a vista de escritorio
  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false)
    }
  }, [isMobile])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isProfileMenuOpen && !target.closest(".relative")) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isProfileMenuOpen])

  const navLinks = [
    { href: "/", label: "Inicio", icon: <Home className="h-5 w-5 mr-2" /> },
    { href: "/reservas-deportivas", label: "Reservas Deportivas", icon: <Calendar className="h-5 w-5 mr-2" /> },
    { href: "/reservas-gimnasio", label: "Gimnasio", icon: <Dumbbell className="h-5 w-5 mr-2" /> },
    { href: "/reservas-piscina", label: "Piscina", icon: <Pool className="h-5 w-5 mr-2" /> },
    { href: "/contacto", label: "Contacto", icon: null },
  ]

  const userLinks = [
    { href: "/mis-reservas", label: "Mis Reservas", icon: <Calendar className="h-5 w-5 mr-2" /> },
    { href: "/mis-bonos", label: "Mis Bonos", icon: <CreditCard className="h-5 w-5 mr-2" /> },
    { href: "/perfil", label: "Mi Perfil", icon: <User className="h-5 w-5 mr-2" /> },
  ]

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">La Llosa</span>
          </Link>

          {/* Navegación de escritorio */}
          <nav className="hidden md:flex ml-6 space-x-4 text-base">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${
                  isActive(link.href) ? "bg-accent text-accent-foreground" : "text-foreground/70"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />

          {isLoggedIn ? (
            <div className="hidden md:flex items-center gap-2">
              <div className="relative">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-base"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                >
                  <User className="h-5 w-5" />
                  <span className="max-w-[100px] truncate">{user?.name || "Usuario"}</span>
                </Button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-background border border-border z-50">
                    <div className="py-1">
                      {userLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="flex items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          {link.icon}
                          {link.label}
                        </Link>
                      ))}
                      <button
                        onClick={() => {
                          logout()
                          setIsProfileMenuOpen(false)
                        }}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <LogOut className="h-5 w-5 mr-2" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowLoginModal(true)} className="text-base">
                Iniciar sesión
              </Button>
              <Button onClick={() => setShowLoginModal(true)} className="text-base">
                Registrarse
              </Button>
            </div>
          )}

          {/* Botón de menú móvil */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Menú móvil */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t"
          >
            <div className="container py-4">
              <nav className="flex flex-col space-y-2 text-base">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${
                      isActive(link.href) ? "bg-accent text-accent-foreground" : "text-foreground/70"
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}

                {isLoggedIn ? (
                  <>
                    <div className="h-px bg-border my-2"></div>
                    {userLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${
                          isActive(link.href) ? "bg-accent text-accent-foreground" : "text-foreground/70"
                        }`}
                      >
                        {link.icon}
                        {link.label}
                      </Link>
                    ))}
                    <button
                      onClick={logout}
                      className="flex items-center px-3 py-2 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col space-y-2 mt-4">
                    <Button variant="outline" onClick={() => setShowLoginModal(true)} className="w-full text-base">
                      Iniciar sesión
                    </Button>
                    <Button onClick={() => setShowLoginModal(true)} className="w-full text-base">
                      Registrarse
                    </Button>
                  </div>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de inicio de sesión */}
      {showLoginModal && (
        <LoginModal onSuccess={() => setShowLoginModal(false)} onClose={() => setShowLoginModal(false)} />
      )}
    </header>
  )
}

