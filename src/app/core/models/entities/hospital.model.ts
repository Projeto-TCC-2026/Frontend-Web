export interface Hospital {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  active?: boolean;
}
