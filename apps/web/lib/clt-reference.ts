import { getBrazilMinimumWage } from "@/lib/brazil-minimum-wage";

export const CLT_INSS_RATE = 0.075;
export const CLT_VT_RATE = 0.06;
export const CLT_FGTS_RATE = 0.08;

export type CltReference = {
  gross: number;
  inss: number;
  transport: number;
  fgtsEmployer: number;
  irrf: number;
  net: number;
  legalAct: string;
  effectiveFrom: string;
};

export function buildCltReference(asOf: Date = new Date()): CltReference {
  const wage = getBrazilMinimumWage(asOf);
  const gross = wage.amount;
  const inss = gross * CLT_INSS_RATE;
  const transport = gross * CLT_VT_RATE;
  const fgtsEmployer = gross * CLT_FGTS_RATE;
  const irrf = 0;
  const net = gross - inss - transport - irrf;
  return {
    gross,
    inss,
    transport,
    fgtsEmployer,
    irrf,
    net,
    legalAct: wage.legalAct,
    effectiveFrom: wage.effectiveFrom,
  };
}
