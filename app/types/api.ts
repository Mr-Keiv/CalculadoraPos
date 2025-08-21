export interface ApiStatus {
  estado: string;
  aleatorio: number;
}

export interface BcvResponse {
  url: string;
  euro: string;    // En string con coma
  dolar: string;   // En string con coma
  fecha: string;   // Ej: "14/07/25"
}

export interface ExchangeRate {
  fuente: 'oficial';
  nombre: string;
  promedio: number;
}
export interface PaymentValidation {
  cedula: string;
  monto: number;
  telefono?: string;
  banco?: string;
}