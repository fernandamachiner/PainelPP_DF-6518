import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function usePesquisadores() {
  return useQuery({ ...orpc.pesquisadores.list.queryOptions(), staleTime: 5 * 60_000 });
}

/** Regiões de cada grupo (aba Definições). */
export function useGruposInfo() {
  return useQuery({
    ...orpc.pesquisadores.grupos.queryOptions(),
    staleTime: 10 * 60_000,
    select: (rows) => new Map(rows.map((r) => [String(r.numero), r.regioes])),
  });
}

export function useAtualizarPesquisador() {
  const qc = useQueryClient();
  return useMutation(orpc.pesquisadores.update.mutationOptions({ onSuccess: () => qc.invalidateQueries({ queryKey: orpc.pesquisadores.list.key() }) }));
}

export function useRegistros(pesquisadorId: number) {
  return useQuery(orpc.registros.list.queryOptions({ input: { pesquisadorId } }));
}
export function useAdicionarRegistro() {
  const qc = useQueryClient();
  return useMutation(orpc.registros.add.mutationOptions({ onSuccess: () => qc.invalidateQueries({ queryKey: orpc.registros.key() }) }));
}
export function useRemoverRegistro() {
  const qc = useQueryClient();
  return useMutation(orpc.registros.remove.mutationOptions({ onSuccess: () => qc.invalidateQueries({ queryKey: orpc.registros.key() }) }));
}
