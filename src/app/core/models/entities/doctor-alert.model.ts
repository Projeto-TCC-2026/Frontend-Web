/** Status de um alerta no fluxo de confirmação com o paciente. */
export type DoctorAlertStatus = 'PENDING' | 'AWAITING_PATIENT' | 'RESOLVED';

/** Tipos de leitura conhecidos. O backend pode enviar outros valores. */
export type DoctorAlertReadingType = 'HEART_RATE' | 'SPO2' | 'TEMPERATURE';

/** Resposta do paciente à confirmação enviada pelo sistema. */
export type DoctorAlertPatientResponse = 'OK' | 'NOT_OK';

/** Motivo pelo qual o alerta chegou ao médico. */
export type DoctorAlertConfirmationReason =
  | 'DUAS_LEITURAS'
  | 'PACIENTE_NAO_ESTA_BEM'
  | 'SEM_RESPOSTA';

export interface DoctorAlert {
  id: string;
  patientId: string;
  patientName: string;
  /** Valor conhecido (HEART_RATE, SPO2, TEMPERATURE) ou qualquer outro enviado pelo backend. */
  readingType: DoctorAlertReadingType | string;
  /** O backend envia o valor já formatado como texto. */
  readingValue: string;
  unit: string;
  /** ISO 8601 em UTC (sufixo "Z"). */
  measuredAt: string;
  severity: string;
  title: string;
  status: DoctorAlertStatus;
  /** ISO 8601 em UTC (sufixo "Z") ou null quando ainda não confirmado. */
  confirmedAt: string | null;
  patientResponse: DoctorAlertPatientResponse | null;
  confirmationReason: DoctorAlertConfirmationReason | null;
}

/** Página do Spring Data devolvida dentro de `data` pela API de alertas. */
export interface DoctorAlertPage {
  content: DoctorAlert[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

/** Envelope padrão da API (`{ success, data }`). */
export interface DoctorAlertApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
