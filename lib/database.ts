import type { ObjectId } from "mongodb"

export type Usuario = {
  id?: string
  _id?: ObjectId
  nombre: string
  email: string
  telefono?: string
  password: string
  tipo: string
  dni?: string
  imagenPerfil?: string
  createdAt: Date
  updatedAt: Date
}

export type Reserva = {
  id?: string
  _id?: ObjectId
  idUsuario: string
  nombre: string
  email: string
  telefono?: string
  dni?: string
  instalacion: string
  tipoReserva: string
  fecha: Date
  horaInicio: string
  horaFin?: string
  horas: number
  precio: number
  esLocal: boolean
  conLuz: boolean
  estado: "pendiente" | "confirmada" | "cancelada"
  createdAt: Date
  updatedAt: Date
}

export type Pago = {
  id?: string
  _id?: ObjectId
  reservaId: string
  usuarioId: string
  monto: number
  metodoPago: string
  estado: string
  referencia: string
  createdAt: Date
  updatedAt: Date
}

// Funciones auxiliares para trabajar con la base de datos
export async function getReservasByUsuarioId(usuarioId: string): Promise<Reserva[]> {
  try {
    const token = localStorage.getItem("auth_token")
    if (!token) {
      throw new Error("No se encontró token de autenticación")
    }

    const response = await fetch(`/api/reservas?usuarioId=${usuarioId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Error al obtener reservas")
    }

    return await response.json()
  } catch (error) {
    console.error("Error al obtener reservas:", error)
    return []
  }
}

export async function cancelarReserva(reservaId: string): Promise<boolean> {
  try {
    const token = localStorage.getItem("auth_token")
    if (!token) {
      throw new Error("No se encontró token de autenticación")
    }

    const response = await fetch(`/api/reservas/${reservaId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Error al cancelar reserva")
    }

    return true
  } catch (error) {
    console.error("Error al cancelar reserva:", error)
    return false
  }
}

