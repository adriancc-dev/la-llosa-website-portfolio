import { google } from 'googleapis';

// Parsear el JSON directamente
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
// Si GoogleAuth necesita saltos de línea reales en la private_key:
credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function verificarEstadoPago(numeroCarnet: string): Promise<boolean> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Hoja1!B:C', // Ahora la columna B tiene el número de carnet y la C el estado
    });

    const rows = response.data.values;
    if (!rows) {
      return false;
    }

    // Buscar el número de carnet en la hoja
    const carnetEncontrado = rows.find(row => row[0] === numeroCarnet);
    
    // Si no se encuentra el carnet, retornar false
    if (!carnetEncontrado) {
      return false;
    }

    // Verificar si está al corriente de pago (asumiendo que la columna C tiene el estado)
    return carnetEncontrado[1]?.toUpperCase() === 'SI';
  } catch (error) {
    console.error('Error al verificar estado de pago:', error);
    return false;
  }
} 