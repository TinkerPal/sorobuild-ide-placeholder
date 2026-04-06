import { Toaster } from "sonner";
import ContractDapp from "./pages/contract-dapp/ContractDapp";

import {
  Route,
  Routes,
  BrowserRouter as Router,
  Navigate,
} from "react-router-dom";
import NotFound from "./not-found/NotFound";
import BuyCredit from "./components/BuyCredit";
import Layout from "./common/Layout";
import { StatesProvider } from "./contexts/StatesContext";

import DeployContract from "./pages/contract-dapp/DeployContract";
import LoadedContract from "./pages/contract-dapp/LoadedContract";
import LoadContract from "./pages/contract-dapp/LoadContract";
import ClassicTools from "./pages/contract-dapp/ClassicTools";

import TransactionBuilderFeature from "./pages/contract-dapp/TransactionBuilderFeature";
import InDevelopmentFloating from "./pages/contract-dapp/InDevelopmentFloating";
import SorobuildIDE from "./pages/contract-dapp/SorobuildIDE";

function App() {
  return (
    <div className="bg-gray-100 h-screen">
      <Toaster position="top-center" richColors />
      {/* <Router>
        <StatesProvider>
          <BuyCredit />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<ContractDapp />}>
                <Route index element={<Navigate to="contract" replace />} />

                <Route path="contract" element={<LoadContract />} />

                <Route
                  path="contract/:loadedNetwork/:contractId"
                  element={<LoadedContract />}
                />

                <Route path="deploy" element={<DeployContract />} />
                <Route path="asset" element={<ClassicTools />} />
                <Route path="builder" element={<TransactionBuilderFeature />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </StatesProvider>
      </Router> */}
      <InDevelopmentFloating />
      <SorobuildIDE />
    </div>
  );
}

export default App;
