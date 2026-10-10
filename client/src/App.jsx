import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <AppRoutes />
        <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
        }}
      />
      </ConfirmProvider>
    </AuthProvider>
  );
}

export default App;