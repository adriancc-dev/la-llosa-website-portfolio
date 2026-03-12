import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-primary/10 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Image
                src="/escudo.jpg"
                alt="Logo Ayuntamiento de La Llosa"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
              <span className="font-semibold text-lg">Ayuntamiento de La Llosa</span>
            </div>
            <p className="text-sm text-muted-foreground">
              El Ayuntamiento de La Llosa ofrece facilidad de servicios deportivos para todos los ciudadanos.
            </p>
            
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Enlaces Rápidos</h3>
            <nav className="flex flex-col space-y-2">
              <Link href="/" className="text-sm text-foreground/70 hover:text-primary">
                Inicio
              </Link>
              <Link href="/reservas-deportivas" className="text-sm text-foreground/70 hover:text-primary">
                Reservas Deportivas
              </Link>
              <Link href="/reservas-gimnasio" className="text-sm text-foreground/70 hover:text-primary">
                Reservas Gimnasio
              </Link>
              <Link href="/reservas-piscina" className="text-sm text-foreground/70 hover:text-primary">
                Reservas Piscina
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contacto</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Plaza España, 14, 12591 La Llosa, Castellón</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4 text-primary" />
                <span>96 261 05 42</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <span>ayuntamiento.lallosa@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Ayuntamiento de La Llosa. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

