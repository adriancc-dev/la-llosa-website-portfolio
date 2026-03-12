// Definición de la interfaz EmailOptions
interface EmailOptions {
  to: string
  subject: string
  message: string
}

// Función para enviar correo usando la API route
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      throw new Error("Error al enviar el correo")
    }

    return true
  } catch (error) {
    console.error("Error al enviar correo:", error)
    return false
  }
}

