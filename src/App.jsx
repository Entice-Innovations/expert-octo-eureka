import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";

import CustomerDashboard from "./pages/customer/CustomerDashboard";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ==============================
            PUBLIC WEBSITE
        ============================== */}

        <Route
          path="/"
          element={<Home />}
        />


        {/* ==============================
            CUSTOMER LOGIN
        ============================== */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* ==============================
            CUSTOMER SIGN UP
        ============================== */}

        <Route
          path="/signup"
          element={<Signup />}
        />


        {/* ==============================
            FORGOT PASSWORD
        ============================== */}

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />


        {/* ==============================
            CUSTOMER DASHBOARD
        ============================== */}

        <Route
          path="/customer/dashboard"
          element={<CustomerDashboard />}
        />


        {/* ==============================
            ADMIN LOGIN
        ============================== */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />


        {/* ==============================
            ADMIN DASHBOARD
        ============================== */}

        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;