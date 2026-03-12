import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Función para formatear fechas
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

// Función para formatear horas
export function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":")
  return `${hours.padStart(2, "0")}:${minutes ? minutes.padStart(2, "0") : "00"}`
}

export function redirectToRedsys({ url, merchantParams, signature, merchantCode }: {
  url: string;
  merchantParams: string;
  signature: string;
  merchantCode: string;
}) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = url;
  const params = {
    Ds_SignatureVersion: 'HMAC_SHA256_V1',
    Ds_MerchantParameters: merchantParams,
    Ds_Signature: signature,
    Ds_MerchantCode: merchantCode,
  };
  Object.entries(params).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

