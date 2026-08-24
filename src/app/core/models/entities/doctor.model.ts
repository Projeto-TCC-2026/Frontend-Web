export interface DoctorUserRef {
  id: string;
  email: string;
}

export interface DoctorHospitalRef {
  id: string;
  name: string;
}

export interface Doctor {
  id: string;
  userId?: string;
  hospitalId?: string;
  /** Populated by the API when the doctor is fetched with nested user info. */
  user?: DoctorUserRef;
  /** Populated by the API when the doctor is fetched with nested hospital info (ADMIN view). */
  hospital?: DoctorHospitalRef;
  fullName: string;
  cpf: string;
  crm: string;
  specialty: string;
  phone: string;
}
