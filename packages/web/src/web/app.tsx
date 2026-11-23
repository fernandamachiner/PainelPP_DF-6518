import { Route, Switch } from "wouter";
import { AgentFeedback } from "@runablehq/website-runtime";
import { Provider } from "./components/provider";
import { Protegido } from "./components/protegido";
import { registrarPwa } from "./lib/pwa";
import Acessos from "./pages/acessos";
import Auditoria from "./pages/auditoria";
import Entrar from "./pages/entrar";
import Grupo from "./pages/grupo";
import Grupos from "./pages/grupos";
import PaginaMapa from "./pages/mapa";
import Pesquisador from "./pages/pesquisador";
import Pesquisadores from "./pages/pesquisadores";
import RedefinirSenha from "./pages/redefinir-senha";
import VisaoGeral from "./pages/visao-geral";

registrarPwa();

function App() {
  return (
    <Provider>
      <Switch>
        <Route path="/entrar" component={Entrar} />
        <Route path="/redefinir-senha" component={RedefinirSenha} />
        <Route path="/mapa"><Protegido><PaginaMapa /></Protegido></Route>
        <Route path="/grupos"><Protegido><Grupos /></Protegido></Route>
        <Route path="/grupos/:id">{(params) => <Protegido><Grupo params={params} /></Protegido>}</Route>
        <Route path="/pesquisadores"><Protegido><Pesquisadores /></Protegido></Route>
        <Route path="/pesquisadores/:id">{(params) => <Protegido><Pesquisador params={params} /></Protegido>}</Route>
        <Route path="/acessos"><Protegido soCoordenacao><Acessos /></Protegido></Route>
        <Route path="/auditoria"><Protegido soCoordenacao><Auditoria /></Protegido></Route>
        <Route path="/"><Protegido><VisaoGeral /></Protegido></Route>
      </Switch>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
    </Provider>
  );
}

export default App;
