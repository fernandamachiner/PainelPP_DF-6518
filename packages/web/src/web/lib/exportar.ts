import * as XLSX from "xlsx";
import { client } from "./api";
import { nomeGrupo, type Pesquisador } from "./pesquisadores";

export function exportarPlanilha(lista: Pesquisador[], nomeArquivo: string) {
  const linhas = lista.map((p) => ({
    Grupo: nomeGrupo(p.grupo),
    Monitores: p.monitores,
    Nome: p.nome,
    Celular: p.celular,
    "E-mail": p.email,
    Endereço: p.endereco,
    RA: p.cidade,
    Estado: p.estado,
    CEP: p.cep,
    Latitude: p.latitude ?? "",
    Longitude: p.longitude ?? "",
    Sexo: p.sexo,
    Escolaridade: p.escolaridade,
    "Formação/Ocupação": p.formacao,
    "Atuação profissional": p.atuacaoProfissional,
    "Local de atuação": p.atuacaoLocal,
    "Esfera de atuação": p.esfera,
    "Profissional da saúde": p.profissionalSaude ? "Sim" : "Não",
  }));
  const ws = XLSX.utils.json_to_sheet(linhas);
  ws["!cols"] = Object.keys(linhas[0] ?? {}).map((k) => ({ wch: k === "Nome" || k === "Endereço" ? 38 : k === "Monitores" ? 40 : 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pesquisadores");
  XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
  // registra a exportação na auditoria (quem, quando, qual arquivo e quantas linhas)
  client.auditoria.exportacao({ arquivo: `${nomeArquivo}.xlsx`, registros: lista.length }).catch(() => {});
}
