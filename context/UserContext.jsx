import axios from "axios";
import { createContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [activeTableData, setActiveTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [withdrawalRequisites, setWithdrawalRequisites] = useState(""); // Состояние для реквизитов
  const [withdrawAmount, setWithdrawAmount] = useState(""); // Состояние для суммы вывода
  const [selectedPaymentOption, setSelectedPaymentOption] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  // Проверка аутентификации
  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await axios.get("/user/settings", {
        withCredentials: true,
      });

      if (data._id && data.auth === 1) {
        setUser({
          _id: data._id,
          login: data.login,
          role: data.role,
          auth: data.auth,
          walletStatus: data.walletStatus,
        });
      } else {
        setUser(null);
        setError("Пользователь не авторизован");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setUser(null);
      setError(error.response?.data?.error || "Ошибка проверки авторизации");
    } finally {
      setLoading(false);
    }
  };

  // Авторизация
  const login = async (credentials) => {
    try {
      const { data } = await axios.post("/account/signin", credentials, {
        withCredentials: true,
      });

      if (data.token) {
        // Токен будет автоматически сохранен в cookies благодаря настройкам сервера
        setUser({
          _id: data._id,
          login: data.login,
          auth: data.auth,
          role: data.role,
        });
      }
      return true;
    } catch (error) {
      console.error("Ошибка входа:", error);
      return false;
    }
  };

  // Выход из системы
  const logout = async () => {
    try {
      await axios.post(
        "/account/logout",
        {},
        {
          withCredentials: true,
        }
      );
      setUser(null);
      toast.success("Выход выполнен успешно");
    } catch (error) {
      console.error("Ошибка при выходе из системы:", error);
      toast.error("Ошибка при выходе из системы");
    }
  };

  const toggleWallet = async () => {
    try {
      const { data } = await axios.post(
        "/user/toggle-wallet",
        {},
        {
          withCredentials: true,
        }
      );
      console.log("Toggle wallet response:", data);

      setUser((prevUser) => ({
        ...prevUser,
        walletStatus: data.walletStatus,
      }));

      if (data.walletStatus === 0) {
        console.log("Deactivating payment options in client...");
        setPaymentOptions((prevOptions) => {
          const newOptions = prevOptions.map((option) => ({
            ...option,
            isActive: false,
          }));
          console.log("New payment options:", newOptions);
          return newOptions;
        });
      }

      // Запросим обновленные данные с сервера
      await loadPaymentOptions();

      return data.walletStatus;
    } catch (error) {
      console.error("Error toggling wallet:", error);
      toast.error("Ошибка при переключении кошелька");
      return null;
    }
  };

  // Обновление данных пользователя
  const updateUser = (userData) => {
    setUser(userData);
    setError(null);
  };

  // Проверка состояния сессии
  const checkSession = async () => {
    try {
      const { data } = await axios.get("/user/check-session", {
        withCredentials: true,
      });
      return data.isValid;
    } catch (error) {
      console.error("Session check error:", error);
      return false;
    }
  };

  // Загрузка платежных опций
  const loadPaymentOptions = async () => {
    try {
      const response = await axios.get("/api/payment-options", {
        withCredentials: true,
      });
      console.log("Loaded payment options:", response.data);
      setPaymentOptions(response.data);
      // Очистка кэша, если вы хотите, чтобы кэш не использовался
      localStorage.removeItem("paymentOptions");
    } catch (error) {
      console.error("Error loading payment options:", error);
      toast.error("Ошибка при загрузке платежных опций");
    }
  };

  const fetchActiveApplications = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/applications?type=active", {
        withCredentials: true,
      });
      setActiveTableData(response.data);
    } catch (error) {
      console.error("Ошибка при получении активных заявок:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Не удалось загрузить активные заявки";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        loading,
        error,
        login,
        logout,
        checkAuth,
        toggleWallet,
        updateUser,
        checkSession,
        paymentOptions,
        setPaymentOptions,
        loadPaymentOptions,
        activeTableData,
        fetchActiveApplications,
        selectedPaymentOption,
        setSelectedPaymentOption,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
