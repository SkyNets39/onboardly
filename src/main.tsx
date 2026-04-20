import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AuthProvider } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import App from "./App.tsx";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TooltipProvider>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools initialIsOpen={false} />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
          }}
        />
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </TooltipProvider>
  </StrictMode>,
);
