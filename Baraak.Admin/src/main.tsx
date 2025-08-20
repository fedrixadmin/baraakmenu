import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App";

import { AdminGate } from "./guards";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // keep your header/shell
    children: [
      { path: "/admin/login", element: <AdminLogin /> },
      { path: "/admin", element: <AdminGate><Admin /></AdminGate> },
      // nothing else here — this app is admin ONLY
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
