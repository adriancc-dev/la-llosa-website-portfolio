// Simulación de envío de correos para v0
// En un entorno real, esto usaría Nodemailer

export type EmailOptions = {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Simulación de envío de correo
  console.log("Enviando correo a:", options.to)
  console.log("Asunto:", options.subject)
  console.log("Contenido:", options.text)

  // Simulamos un pequeño retraso
  await new Promise((resolve) => setTimeout(resolve, 500))

  // En un entorno real, aquí se usaría Nodemailer:
  /*
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD
    }
  });
  
  await transporter.sendMail({
    from: process.env.EMAIL,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html
  });
  */

  return true
}

export function createReservaEmailContent(reserva: {
  nombre: string
  email: string
  telefono: string
  instalacion: string
  fecha: Date
  horaInicio: string
  horaFin: string
  horas: number
  precio: number
  esLocal: boolean
  conLuz: boolean
}): { text: string; html: string } {
  const fechaFormateada = reserva.fecha.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const text = `
    Confirmación de Reserva - Ayuntamiento de La Llosa
    
    Hola ${reserva.nombre},
    
    Tu reserva ha sido confirmada con los siguientes detalles:
    
    Instalación: ${reserva.instalacion}
    Fecha: ${fechaFormateada}
    Horario: ${reserva.horaInicio} a ${reserva.horaFin} (${reserva.horas} horas)
    Usuario: ${reserva.esLocal ? "Local" : "No local"}
    Iluminación: ${reserva.conLuz ? "Con luz" : "Sin luz"}
    Precio total: ${reserva.precio.toFixed(2)}€
    
    Si necesitas modificar o cancelar tu reserva, por favor contacta con nosotros.
    
    Gracias por utilizar nuestros servicios deportivos.
    
    Ayuntamiento de La Llosa
    Plaça España, 14, 12591 La Llosa, Castellón
    Teléfono: +34 619 94 94 94
    Email: info@ayuntamientolallosa.es
  `

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #22c55e;">Confirmación de Reserva - Ayuntamiento de La Llosa</h2>
      
      <p>Hola <strong>${reserva.nombre}</strong>,</p>
      
      <p>Tu reserva ha sido confirmada con los siguientes detalles:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Instalación:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${reserva.instalacion}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Fecha:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${fechaFormateada}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Horario:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${reserva.horaInicio} a ${reserva.horaFin} (${reserva.horas} horas)</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Usuario:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${reserva.esLocal ? "Local" : "No local"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Iluminación:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${reserva.conLuz ? "Con luz" : "Sin luz"}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Precio total:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>${reserva.precio.toFixed(2)}€</strong></td>
        </tr>
      </table>
      
      <p>Si necesitas modificar o cancelar tu reserva, por favor contacta con nosotros.</p>
      
      <p>Gracias por utilizar nuestros servicios deportivos.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
        <p><strong>Ayuntamiento de La Llosa</strong><br>
        Plaça España, 14, 12591 La Llosa, Castellón<br>
        Teléfono: +34 619 94 94 94<br>
        Email: info@ayuntamientolallosa.es</p>
      </div>
    </div>
  `

  return { text, html }
}

export function createContactEmailContent(contacto: {
  nombre: string
  email: string
  telefono: string
  asunto: string
  mensaje: string
}): { text: string; html: string } {
  const text = `
    Nuevo mensaje de contacto - Ayuntamiento de La Llosa
    
    Nombre: ${contacto.nombre}
    Email: ${contacto.email}
    Teléfono: ${contacto.telefono}
    Asunto: ${contacto.asunto}
    
    Mensaje:
    ${contacto.mensaje}
  `

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #22c55e;">Nuevo mensaje de contacto - Ayuntamiento de La Llosa</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Nombre:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${contacto.nombre}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${contacto.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Teléfono:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${contacto.telefono}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Asunto:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${contacto.asunto}</td>
        </tr>
      </table>
      
      <h3 style="margin-top: 20px;">Mensaje:</h3>
      <p style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">${contacto.mensaje.replace(/\n/g, "<br>")}</p>
    </div>
  `

  return { text, html }
}

