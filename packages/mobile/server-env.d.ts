// Tipos do servidor (importados via AppRouter) leem variáveis de ambiente arbitrárias.
declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
  }
}
