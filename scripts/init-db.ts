import { connectToDatabase } from "../lib/mongodb.js";
import { fileURLToPath } from "node:url";

// Obtener el nombre del archivo actual
const __filename = fileURLToPath(import.meta.url);

async function initDatabase() {
  try {
    const { db, client } = await connectToDatabase();

    // Verificar si ya existen instalaciones
    const instalacionesCount = await db.collection("instalaciones").countDocuments();

    if (instalacionesCount === 0) {
      // Insertar instalaciones predeterminadas
      const instalaciones = [
        {
          nombre: "Pista de Pádel",
          tipo: "padel",
          descripcion: "Pista de pádel con iluminación",
          imagenes: ["/placeholder.svg?height=300&width=400&text=Pádel"],
          horarioInvierno: { inicio: "08:00", fin: "22:00" },
          horarioVerano: { inicio: "07:00", fin: "24:00" },
          precios: {
            "local-sin-luz": 0,
            "local-con-luz": 4,
            "no-local-sin-luz": 4,
            "no-local-con-luz": 8,
          },
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          nombre: "Campo de Fútbol",
          tipo: "futbol",
          descripcion: "Campo de fútbol con iluminación",
          imagenes: ["/placeholder.svg?height=300&width=400&text=Fútbol"],
          horarioInvierno: { inicio: "08:00", fin: "22:00" },
          horarioVerano: { inicio: "07:00", fin: "24:00" },
          precios: {
            "local-sin-luz": 0,
            "local-con-luz": 10,
            "no-local-sin-luz": 15,
            "no-local-con-luz": 30,
          },
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          nombre: "Frontón",
          tipo: "fronton",
          descripcion: "Frontón con iluminación",
          imagenes: ["/placeholder.svg?height=300&width=400&text=Frontón"],
          horarioInvierno: { inicio: "08:00", fin: "22:00" },
          horarioVerano: { inicio: "07:00", fin: "24:00" },
          precios: {
            "local-sin-luz": 0,
            "local-con-luz": 4,
            "no-local-sin-luz": 4,
            "no-local-con-luz": 8,
          },
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          nombre: "Gimnasio Municipal",
          tipo: "gimnasio",
          descripcion: "Gimnasio municipal con equipamiento completo",
          imagenes: ["/placeholder.svg?height=300&width=400&text=Gimnasio"],
          horarioInvierno: { inicio: "08:00", fin: "22:00" },
          horarioVerano: { inicio: "07:00", fin: "22:00" },
          precios: {
            "jubilado-local": { diaria: 1.0, mensual: 6.0, trimestral: 15.0 },
            local: { diaria: 2.0, mensual: 9.0, trimestral: 30.0 },
            "no-local": { diaria: 2.5, mensual: 12.0, trimestral: 55.0 },
          },
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          nombre: "Piscina Municipal",
          tipo: "piscina",
          descripcion: "Piscina municipal al aire libre",
          imagenes: ["/placeholder.svg?height=300&width=400&text=Piscina"],
          horarioInvierno: { inicio: "10:00", fin: "20:00" },
          horarioVerano: { inicio: "10:00", fin: "21:00" },
          precios: {
            individual: { "local-menor-3": 0, "local-adulto": 1.5, "no-local-adulto": 3 },
            "bono-mensual": { "local-adulto": 25, "no-local-adulto": 50, familiar: 75 },
            "bono-temporada": { "local-adulto": 60, "no-local-adulto": 100 },
          },
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await db.collection("instalaciones").insertMany(instalaciones);
      console.log("Instalaciones inicializadas correctamente");
    } else {
      console.log("La base de datos ya contiene instalaciones");
    }

    // Verificar si ya existe configuración
    const configCount = await db.collection("configuracion").countDocuments();

    if (configCount === 0) {
      // Insertar configuración predeterminada
      const configuraciones = [
        {
          clave: "temporada_actual",
          valor: "invierno",
          descripcion: "Temporada actual para horarios",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          clave: "email_notificaciones",
          valor: process.env.EMAIL || "admin@example.com",
          descripcion: "Email para enviar notificaciones",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await db.collection("configuracion").insertMany(configuraciones);
      console.log("Configuración inicializada correctamente");
    } else {
      console.log("La base de datos ya contiene configuración");
    }

    await client.close();
    console.log("Base de datos inicializada correctamente");
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
    // Propagar el error para que se capture en el bloque .catch del main
    throw error;
  }
}

// Ejecutar la función si este archivo se ejecuta directamente
if (process.argv[1] === __filename) {
  initDatabase()
    .then(() => {
      console.log("Base de datos inicializada correctamente.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error al inicializar la base de datos:", error);
      process.exit(1);
    });
}

export default initDatabase;
