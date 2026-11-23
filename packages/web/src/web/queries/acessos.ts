import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useEu(enabled = true) {
  return useQuery({ ...orpc.acessos.eu.queryOptions(), enabled, retry: false, staleTime: 60_000 });
}
export function useAcessos() {
  return useQuery(orpc.acessos.list.queryOptions());
}
export function useAdicionarAcesso() {
  const qc = useQueryClient();
  return useMutation(orpc.acessos.add.mutationOptions({ onSuccess: () => qc.invalidateQueries({ queryKey: orpc.acessos.key() }) }));
}
export function useRemoverAcesso() {
  const qc = useQueryClient();
  return useMutation(orpc.acessos.remove.mutationOptions({ onSuccess: () => qc.invalidateQueries({ queryKey: orpc.acessos.key() }) }));
}
export function useAtualizarAcesso() {
  const qc = useQueryClient();
  return useMutation(orpc.acessos.update.mutationOptions({ onSuccess: () => qc.invalidateQueries({ queryKey: orpc.acessos.key() }) }));
}
export function useAuditoria() {
  return useQuery(orpc.auditoria.list.queryOptions({ input: { limite: 300 } }));
}
export function useOpcoes() {
  return useQuery({ ...orpc.acessos.opcoes.queryOptions(), staleTime: 10 * 60_000 });
}
export function useAceitarPrivacidade() {
  const qc = useQueryClient();
  return useMutation(orpc.acessos.aceitarPrivacidade.mutationOptions({ onSuccess: () => qc.invalidateQueries({ queryKey: orpc.acessos.eu.key() }) }));
}
export function useLinkSenha() {
  return useMutation(orpc.acessos.linkSenha.mutationOptions());
}
