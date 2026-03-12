// Datos simulados para la aplicación

// Tipos
export type Usuario = {
  id: string
  nombre: string
  email: string
  telefono?: string
  tipo: "local" | "no-local" | "jubilado-local"
  ficha_municipal?: string
}

export type Instalacion = {
  id: string
  nombre: string
  tipo: "padel" | "futbol" | "futbol-sala" | "fronton" | "gimnasio" | "piscina"
}

export type Reserva = {
  id: string
  usuarioId: string
  instalacionId: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  precio: number
  estado: "pendiente" | "pagado" | "cancelado"
}

// Tipos para precios
export type CondicionGimnasio = "jubilado-local" | "local" | "no-local";
export type TipoGimnasio = "diaria" | "mensual" | "trimestral";

export type CondicionPiscinaIndividual = "local-menor-3" | "local-adulto" | "no-local-adulto";
export type CondicionPiscinaBonoMensual = "local-adulto" | "no-local-adulto" | "familiar";
export type CondicionPiscinaBonoTemporada = "local-adulto" | "no-local-adulto";
export type CursoPiscina = "aquasalud" | "infantil" | "adultos";
export type CondicionPiscinaCurso = "local-jubilado" | "local-adulto" | "no-local-adulto";

// Datos de ejemplo
export const instalaciones: Instalacion[] = [
  { id: "1", nombre: "Pista de Pádel", tipo: "padel" },
  { id: "2", nombre: "Campo de Fútbol", tipo: "futbol" },
  { id: "4", nombre: "Frontón", tipo: "fronton" },
  { id: "5", nombre: "Gimnasio Municipal", tipo: "gimnasio" },
  { id: "6", nombre: "Piscina Municipal", tipo: "piscina" },
]

// Precios para instalaciones deportivas
export const preciosDeportivos = {
  // Local + Sin luz: Gratis
  "local-sin-luz": {
    padel: 0,
    futbol: 0,
    fronton: 0,
  },
  // Local + Con luz
  "local-con-luz": {
    padel: 4,
    futbol: 10,
    fronton: 4,
  },
  // No local + Sin luz
  "no-local-sin-luz": {
    padel: 4,
    futbol: 15,
    fronton: 4,
  },
  // No local + Con luz
  "no-local-con-luz": {
    padel: 8,
    futbol: 30,
    fronton: 8,
  },
}

// Precios para gimnasio
export const preciosGimnasio: Record<CondicionGimnasio, Record<TipoGimnasio, number>> = {
  "jubilado-local": {
    diaria: 1.0,
    mensual: 6.0,
    trimestral: 15.0,
  },
  local: {
    diaria: 2.0,
    mensual: 9.0,
    trimestral: 30.0,
  },
  "no-local": {
    diaria: 2.5,
    mensual: 12.0,
    trimestral: 55.0,
  },
}

// Precios para piscina
export const preciosPiscina = {
  individual: {
    "local-menor-3": 0, // Gratis
    "local-adulto": 1.5,
    "no-local-adulto": 3,
  } as Record<CondicionPiscinaIndividual, number>,
  "bono-mensual": {
    "local-adulto": 25,
    "no-local-adulto": 50,
    familiar: 75,
  } as Record<CondicionPiscinaBonoMensual, number>,
  "bono-temporada": {
    "local-adulto": 60,
    "no-local-adulto": 100,
  } as Record<CondicionPiscinaBonoTemporada, number>,
  curso: {
    aquasalud: {
      "local-jubilado": 0, // Gratis
      "local-adulto": 35,
      "no-local-adulto": 40,
    },
    infantil: {
      "local-jubilado": 40, // No hay gratis para infantil jubilado local
      "local-adulto": 40,
      "no-local-adulto": 40,
    },
    adultos: {
      "local-jubilado": 0, // Gratis
      "local-adulto": 35,
      "no-local-adulto": 40,
    },
  } as Record<CursoPiscina, Record<CondicionPiscinaCurso, number>>,
}

// Función para obtener el precio correcto basado en el estado de pago y carnet
export function obtenerPrecioCorrecto(
  tipo: TipoGimnasio | "individual" | "bono-mensual" | "bono-temporada" | "curso",
  condicion: string,
  esLocal: boolean,
  estaAlCorriente: boolean,
  curso?: string,
  carnetValido?: boolean // Nuevo parámetro opcional
): number {
  // GIMNASIO
  if ((condicion === "local" || condicion === "jubilado-local") && (tipo === "diaria" || tipo === "mensual" || tipo === "trimestral")) {
    const cond = condicion as CondicionGimnasio;
    const t = tipo as TipoGimnasio;
    // Si carnet válido y al corriente, mitad de precio oficial
    if (carnetValido && estaAlCorriente) {
      return preciosGimnasio[cond][t] / 2;
    }
    // Si carnet vacío o no válido, o no está al corriente, precio oficial de local/jubilado-local
    return preciosGimnasio[cond][t];
  }
  // Si es no local, siempre precio oficial de no local
  if (condicion === "no-local" && (tipo === "diaria" || tipo === "mensual" || tipo === "trimestral")) {
    const t = tipo as TipoGimnasio;
    return preciosGimnasio["no-local"][t];
  }

  // PISCINA
  if (
    tipo === "individual" || tipo === "bono-mensual" || tipo === "bono-temporada" || tipo === "curso"
  ) {
    // Si es no local, siempre precio oficial de no local
    if (
      (tipo === "individual" && condicion === "no-local-adulto") ||
      (tipo === "bono-mensual" && condicion === "no-local-adulto") ||
      (tipo === "bono-temporada" && condicion === "no-local-adulto") ||
      (tipo === "curso" && condicion === "no-local-adulto")
    ) {
      if (tipo === "individual") return preciosPiscina.individual["no-local-adulto"];
      if (tipo === "bono-mensual") return preciosPiscina["bono-mensual"]["no-local-adulto"];
      if (tipo === "bono-temporada") return preciosPiscina["bono-temporada"]["no-local-adulto"];
      if (tipo === "curso" && curso) return preciosPiscina.curso[curso as CursoPiscina]["no-local-adulto"];
    }
    // Solo para condiciones locales o jubilado local
    const esCondicionLocal = condicion.startsWith("local") || condicion === "familiar";
    if (esCondicionLocal) {
      if (tipo === "individual") {
        const c = condicion as CondicionPiscinaIndividual;
        // Si carnet válido y al corriente, mitad de precio NO LOCAL
        if (carnetValido && estaAlCorriente) {
          return preciosPiscina.individual["no-local-adulto"] / 2;
        }
        return preciosPiscina.individual[c];
      } else if (tipo === "bono-mensual") {
        const c = condicion as CondicionPiscinaBonoMensual;
        if (carnetValido && estaAlCorriente) {
          return preciosPiscina["bono-mensual"]["no-local-adulto"] / 2;
        }
        return preciosPiscina["bono-mensual"][c];
      } else if (tipo === "bono-temporada") {
        const c = condicion as CondicionPiscinaBonoTemporada;
        if (carnetValido && estaAlCorriente) {
          return preciosPiscina["bono-temporada"]["no-local-adulto"] / 2;
        }
        return preciosPiscina["bono-temporada"][c];
      } else if (tipo === "curso" && curso) {
        const c = condicion as CondicionPiscinaCurso;
        const cur = curso as CursoPiscina;
        if (carnetValido && estaAlCorriente) {
          return preciosPiscina.curso[cur]["no-local-adulto"] / 2;
        }
        return preciosPiscina.curso[cur][c];
      }
    }
  }

  // Si no es local, usar precios de no local (deportivo)
  if (!esLocal) {
    if (tipo === "individual") {
      return preciosPiscina.individual["no-local-adulto"];
    } else if (tipo === "bono-mensual") {
      return preciosPiscina["bono-mensual"]["no-local-adulto"];
    } else if (tipo === "bono-temporada") {
      return preciosPiscina["bono-temporada"]["no-local-adulto"];
    } else if (tipo === "curso" && curso) {
      const cur = curso as CursoPiscina;
      return preciosPiscina.curso[cur]["no-local-adulto"];
    }
  }

  // Si es local pero no está al corriente, usar precios de no local (deportivo)
  if (esLocal && !estaAlCorriente) {
    if (tipo === "individual") {
      return preciosPiscina.individual["no-local-adulto"];
    } else if (tipo === "bono-mensual") {
      return preciosPiscina["bono-mensual"]["no-local-adulto"];
    } else if (tipo === "bono-temporada") {
      return preciosPiscina["bono-temporada"]["no-local-adulto"];
    } else if (tipo === "curso" && curso) {
      const cur = curso as CursoPiscina;
      return preciosPiscina.curso[cur]["no-local-adulto"];
    }
  }

  // Si es local y está al corriente, usar precios de local (deportivo)
  if (tipo === "individual") {
    return preciosPiscina.individual["local-adulto"];
  } else if (tipo === "bono-mensual") {
    return preciosPiscina["bono-mensual"]["local-adulto"];
  } else if (tipo === "bono-temporada") {
    return preciosPiscina["bono-temporada"]["local-adulto"];
  } else if (tipo === "curso" && curso) {
    const cur = curso as CursoPiscina;
    return preciosPiscina.curso[cur]["local-adulto"];
  }

  return 0;
}

// Función para simular la creación de una reserva
export async function crearReserva(datos: Omit<Reserva, "id">): Promise<Reserva> {
  // En una aplicación real, esto guardaría en la base de datos
  const nuevaReserva: Reserva = {
    ...datos,
    id: Math.random().toString(36).substring(2, 9),
  }

  // Simular latencia de red
  await new Promise((resolve) => setTimeout(resolve, 500))

  return nuevaReserva
}

// Función para simular la obtención de reservas de un usuario
export async function obtenerReservasUsuario(usuarioId: string): Promise<Reserva[]> {
  // En una aplicación real, esto consultaría la base de datos
  // Aquí devolvemos un array vacío para simular que no hay reservas previas

  // Simular latencia de red
  await new Promise((resolve) => setTimeout(resolve, 500))

  return []
}

