import AppRouter from "./Router/AppRouter";
import { AuthProvider } from "./Context/AuthContext.jsx";


export default function App() {
  return (
    <>
      
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </>
  );
}
