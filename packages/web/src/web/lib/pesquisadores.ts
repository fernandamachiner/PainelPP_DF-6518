import type { AppRouterClient } from "../../api";

export type Pesquisador = Awaited<ReturnType<AppRouterClient["pesquisadores"]["list"]>>[number];

export const CORES_GRUPO: Record<string, string> = {
  // Cores bem diferentes entre grupos vizinhos no mapa (G1, G4 e G5 ficam lado a lado)
  "1": "#D7262E", "2": "#4C9A2A", "3": "#F0A30A", "4": "#7A3FC0",
  "5": "#E0459B", "6": "#1F5FBF", "7": "#13A3A0", sem: "#8A8F86",
};
export const corGrupo = (g: number | null) => CORES_GRUPO[g == null ? "sem" : String(g)] ?? "#8A8F86";
export const nomeGrupo = (g: number | null) => (g == null ? "Sem grupo" : `Grupo ${g}`);
export const chaveGrupo = (g: number | null) => (g == null ? "sem" : String(g));

const digitos = (s: string) => s.replace(/\D/g, "");
export const linkTel = (cel: string) => `tel:+55${digitos(cel)}`;
export function linkWhats(cel: string, nome?: string) {
  const d = digitos(cel);
  const msg = nome ? `?text=${encodeURIComponent(`Olá, ${nome.split(" ")[0]}! Aqui é do projeto Pesquisadores Populares Interseccionais.`)}` : "";
  return `https://wa.me/55${d}${msg}`;
}
export const linkEmail = (email: string) => `mailto:${email}`;
export function linkRota(p: Pesquisador) {
  if (p.latitude != null && p.longitude != null)
    return `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.endereco}, ${p.cidade} - ${p.estado}, ${p.cep}`)}`;
}

export const iniciais = (nome: string) =>
  nome.split(" ").filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export function contar<T>(lista: T[], chave: (x: T) => string) {
  const m = new Map<string, number>();
  for (const x of lista) { const k = chave(x) || "Não informado"; m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export interface Grupo { grupo: number | null; chave: string; monitores: string[]; membros: Pesquisador[] }
export function agruparPorGrupo(lista: Pesquisador[]): Grupo[] {
  const m = new Map<string, Grupo>();
  for (const p of lista) {
    const k = chaveGrupo(p.grupo);
    if (!m.has(k)) m.set(k, { grupo: p.grupo, chave: k, monitores: [], membros: [] });
    const g = m.get(k)!;
    g.membros.push(p);
    if (!g.monitores.length && p.monitores) g.monitores = p.monitores.split("/").map((s) => s.trim()).filter(Boolean);
  }
  return [...m.values()].sort((a, b) => (a.grupo ?? 99) - (b.grupo ?? 99));
}

export const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
