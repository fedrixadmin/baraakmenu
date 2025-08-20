import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App";

import Kitchen from "./pages/Kitchen";
import KitchenLogin from "./pages/KitchenLogin";
import { KitchenGate } from "./guards";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/kitchen/login", element: <KitchenLogin /> },
      { path: "/kitchen", element: <KitchenGate><Kitchen /></KitchenGate> },
      // nothing else here — this app is kitchen ONLY
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
