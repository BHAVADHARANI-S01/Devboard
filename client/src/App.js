import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider }  from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster }       from "react-hot-toast";
import Login       from "./pages/Login";
import Register    from "./pages/Register";
import Dashboard   from "./pages/Dashboard";
import Project     from "./pages/Project";
import VerifyEmail from "./pages/VerifyEmail";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/"             element={<Login />} />
            <Route path="/login"        element={<Login />} />
            <Route path="/register"     element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/project/:id"  element={<Project />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
