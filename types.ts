export interface ProfilingFormData {
  // Step 1
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  rfc: string;
  companyName: string;
  // Step 2
  personType: 'Física con Actividad Empresarial' | 'Moral' | '';
  satAntiquity: 'Menos de 6 meses' | 'Más de 6 meses' | '';
  monthlyBilling: '<150k' | '150k - 500k' | '+500k' | '';
  creditScore: 'Excelente' | 'Bueno' | 'Regular' | 'Malo' | 'No tengo experiencia' | '';
  // Step 3
  activeProcess: 'Sí' | 'No' | '';
  activeProcessInstitutions: string;
}

export type FormStep = 1 | 2 | 3 | 'result';

export interface AISimulationData {
  niche: string;
  location: string;
  amount: string;
}

export enum SimulationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}