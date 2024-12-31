import React from "react";
import axios from "axios";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import App from "./App";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserProfile from "./pages/UserProfile";
import PrivateRoute from "./components/PrivateRouter";
import PublicRoute from "./components/PublicRoute";
import UserPayments from "./pages/UserPayment";
import AdminNotify from "./pages/AdminNotify";
import AdminRoute from "./components/AdminRoute";
import PaymentPage from "./pages/PaymentPage";
import TransactionsHistory from "./pages/TransactionsHistory";
import AllTables from "./components/AllTables";

import { Toaster } from "react-hot-toast";
import { UserContextProvider } from "../context/UserContext";

axios.defaults.baseURL = "https://mmrtest.ru";
axios.defaults.withCredentials = true;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <UserContextProvider>
        <Toaster position="bottom-right" toastOptions={{ duration: 2000 }} />
        <Routes>
          <Route
            path="/requests"
            element={
              <PrivateRoute>
                <App />
              </PrivateRoute>
            }
          />
          <Route
            path="/account/signin"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/account/signup"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/user/settings"
            element={
              <PrivateRoute>
                <UserProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/user/payments"
            element={
              <PrivateRoute>
                <UserPayments />
              </PrivateRoute>
            }
          />
          <Route path="/payment/:customUrl" element={<PaymentPage />} />
          <Route path="*" element={<Navigate to="/requests" replace />} />
          <Route
            path="/users/notify"
            element={
              <AdminRoute>
                <AdminNotify />
              </AdminRoute>
            }
          />
          <Route
            path="/user/transaction-history"
            element={
              <PrivateRoute>
                <TransactionsHistory showHeader={true} />
              </PrivateRoute>
            }
          />

          {/* Обновленный маршрут для таблиц */}
          <Route
            path="/requests"
            element={
              <PrivateRoute>
                <App />
              </PrivateRoute>
            }
          >
            <Route
              path="/requests/all"
              element={
                <PrivateRoute>
                  <AllTables />
                </PrivateRoute>
              }
            />
            <Route
              path="/requests/active"
              element={
                <PrivateRoute>
                  <AllTables />
                </PrivateRoute>
              }
            />
            <Route
              path="/requests/processing"
              element={
                <PrivateRoute>
                  <AllTables />
                </PrivateRoute>
              }
            />
            <Route
              path="/requests/closed"
              element={
                <PrivateRoute>
                  <AllTables />
                </PrivateRoute>
              }
            />
            <Route
              path="/requests/canceled"
              element={
                <PrivateRoute>
                  <AllTables />
                </PrivateRoute>
              }
            />
          </Route>
        </Routes>
      </UserContextProvider>
    </BrowserRouter>
  </React.StrictMode>
);
