import { Outlet } from "react-router-dom";

import WalletKitModal from "../wallet-kit/WalletKitModal";

export default function Layout() {
  return (
    <div>
      <WalletKitModal />
      <div>
        <Outlet />
      </div>
    </div>
  );
}
