import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./css/Header.css";
import "../components/css/Wrapper.css";
import axios from "axios";
import { UserContext } from "../../context/UserContext";
import { SiTether } from "react-icons/si";
import { FaBell, FaUser } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

import Logo from "../assets/mmr_logo.png";

const Header = () => {
  const navigate = useNavigate();

  const { user, logout, setUser, setPaymentOptions, fetchActiveApplications } =
    useContext(UserContext);
  const [isHeaderBalanceClicked, setIsHeaderBalanceClicked] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [rubBalance, setRubBalance] = useState(0);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountSidebarOpen, setIsAccountSidebarOpen] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isClosingImage, setIsClosingImage] = useState(false);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const popupRef = useRef(null);

  // Загружаем состояние из localStorage при монтировании компонента
  useEffect(() => {
    const hiddenState = localStorage.getItem("isBalanceVisible");
    if (hiddenState !== null) {
      setIsBalanceVisible(JSON.parse(hiddenState));
    }
  }, []);

  // Функция для переключения видимости баланса
  const toggleBalanceVisibility = () => {
    setIsBalanceVisible((prev) => {
      const newState = !prev;
      localStorage.setItem("isBalanceVisible", JSON.stringify(newState)); // Сохраняем новое состояние в localStorage
      return newState;
    });
  };

  // Мемоизируем функцию загрузки данных
  const fetchData = useCallback(async () => {
    try {
      // Параллельная загрузка данных
      const [balanceResponse, notificationsResponse, unreadResponse] =
        await Promise.all([
          axios.get("/api/get-balance", { withCredentials: true }),
          axios.get("/api/notifications", { withCredentials: true }),
          axios.get("/user/settings", { withCredentials: true }),
        ]);

      const { usdtBalance, rubBalance } = balanceResponse.data;

      // Безопасное обновление состояний
      setUsdtBalance((prev) => {
        const newUsdtBalance = parseFloat(usdtBalance) || 0;
        return newUsdtBalance !== prev ? newUsdtBalance : prev;
      });

      setRubBalance((prev) => {
        const newRubBalance = parseFloat(rubBalance) || 0;
        return newRubBalance !== prev ? newRubBalance : prev;
      });

      setUser((prevUser) => ({
        ...prevUser,
        balance: formatNumber(rubBalance),
      }));

      setNotifications(notificationsResponse.data);
      setUnreadNotifications(unreadResponse.data.unreadNotifications);

      // Обновляем кэш
      localStorage.setItem(
        "userBalance",
        JSON.stringify({
          usdtBalance,
          rubBalance,
        })
      );
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    }
  }, [setUser]);

  // Функция для закрытия всех сайдбаров
  const closeAllSidebars = () => {
    setIsNotificationsOpen(false);
    setIsTopUpOpen(false);
    setIsAccountSidebarOpen(false);
    setIsBlurred(false);
  };

  // Обработчик закрытия сайдбара уведомлений
  const handleCloseNotifications = (e) => {
    if (e && typeof e.stopPropagation === "function") {
      e.stopPropagation();
    }
    setIsNotificationsOpen(false);
  };

  // Обработчик закрытия модального окна
  const handleCloseModal = (e) => {
    if (e) {
      e.stopPropagation();
    }

    // Если открыто полноэкранное изображение, сначала закрываем его
    if (isImageFullscreen) {
      setIsClosingImage(true);
      setTimeout(() => {
        setIsImageFullscreen(false);
        setIsClosingImage(false);
      }, 300);
      return;
    }

    setIsClosing(true);
    setTimeout(() => {
      setSelectedNotification(null);
      setIsModalOpen(false);
      setIsClosing(false);
      setIsImageFullscreen(false);
    }, 300);
  };

  const handleAccountClick = (e) => {
    e.stopPropagation();
    setIsAccountSidebarOpen(true);
    setIsBlurred(true);
    setIsHeaderBalanceClicked(false);
  };

  const handleCloseAccount = () => {
    setIsAccountSidebarOpen(false);
    setIsBlurred(false);
  };

  const toggleNotifications = (e) => {
    e.stopPropagation();
    setIsNotificationsOpen((prev) => !prev);
    // Сбрасываем состояние модального окна
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  const openModal = (notification) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  const closeSidebar = () => {
    setIsNotificationsOpen(false);
  };

  // Эффект для первоначальной загрузки и периодического обновления
  useEffect(() => {
    // Загрузка кэшированных данных
    const cachedBalance = localStorage.getItem("userBalance");
    if (cachedBalance) {
      const { usdtBalance, rubBalance } = JSON.parse(cachedBalance);
      setUsdtBalance(parseFloat(usdtBalance) || 0);
      setRubBalance(parseFloat(rubBalance) || 0);
    }

    // Первоначальная загрузка
    fetchData();

    // Интервал обновления
    const intervalId = setInterval(fetchData, 30000);

    // Очистка
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchData]);

  // Обработчик закрытия попапов
  const handleOutsideClick = useCallback((event) => {
    // Логика закрытия попапов
    const topUpSidebar = document.querySelector(".top_up_sidebar");
    const notificationsSidebar = document.querySelector(
      ".notifications_sidebar"
    );
    const accountSidebar = document.querySelector(".account_sidebar");
    const notificationModal = document.querySelector(".notification-modal");
    const fullscreenImageOverlay = document.querySelector(
      ".fullscreen-image-overlay"
    );

    // Проверяем, открыто ли модальное окно с уведомлением
    const isNotificationModalOpen =
      notificationModal && notificationModal.style.display !== "none";

    const isClickInsideSidebars =
      topUpSidebar?.contains(event.target) ||
      notificationsSidebar?.contains(event.target) ||
      accountSidebar?.contains(event.target) ||
      (isNotificationModalOpen && notificationModal.contains(event.target)) || // Проверка для модального окна
      fullscreenImageOverlay?.contains(event.target);

    if (!isClickInsideSidebars) {
      // Закрытие сайдбаров
      setIsTopUpOpen(false);
      setIsNotificationsOpen(false);
      setIsAccountSidebarOpen(false);
      setIsBlurred(false);

      // Сброс состояний полноэкранного изображения
      setIsImageFullscreen(false);
      setSelectedNotification(null);
    }
  }, []);

  // Обработчик клика по уведомлению
  const handleNotificationClick = async (e, notification) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    try {
      openModal(notification);
      await resetNotificationCounter();
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Необходима повторная авторизация");
        navigate("/account/signin");
      } else {
        toast.error("Произошла ошибка при обработке уведомлений");
      }
    }
  };

  const closeNotificationModal = (e) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedNotification(null);
    // Не меняем состояние isBlurred здесь
  };

  // Обработчик для открытия модального окна
  const handleWithdrawClick = (e) => {
    e.preventDefault();
    setIsWithdrawOpen(true);
  };

  // Обработчик для закрытия модального окна
  const handleCloseWithdraw = () => {
    setIsWithdrawOpen(false);
    setWithdrawAmount("");
  };

  // Обработчик для отправки формы
  const handleWithdrawSubmit = async () => {
    const amount = parseFloat(withdrawAmount);
    console.log("Сумма для вывода:", amount);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Пожалуйста, введите корректную сумму");
      return;
    }

    console.log("Обработчик submit вызван");

    try {
      const depositResponse = await axios.get("/api/successful-deposits", {
        withCredentials: true,
      });
      console.log("Ответ на запрос депозитов:", depositResponse.data);

      const activeDeposit = depositResponse.data.find(
        (deposit) => deposit.status === "active" && deposit.amount === amount
      );
      console.log("Найденный активный депозит:", activeDeposit);

      if (activeDeposit) {
        // Если активный депозит найден, просто уведомляем пользователя
        toast.error(
          "У вас уже есть активный депозит на эту сумму. Пожалуйста, завершите его перед созданием нового."
        );
        return; // Выходим из функции, чтобы не продолжать
      } else {
        const customUrl = uuidv4();
        const fullCustomUrl = `https://mmrtest.ru/${customUrl}`;

        console.log("Отправляемые данные:", {
          amount: amount,
          customUrl: fullCustomUrl,
        });

        const response = await axios.post(
          "/api/create-payment-option",
          {
            amount: amount,
            customUrl: fullCustomUrl,
          },
          {
            withCredentials: true,
          }
        );

        if (response.status === 201) {
          console.log("Созданная платежная опция:", response.data);
          navigate(`/payment/${customUrl}`, {
            state: { amount: amount, paymentOption: response.data },
          });
          handleCloseWithdraw();
          toast.success("Платёжная операция создана");
        } else {
          throw new Error("Не удалось создать платежную опцию");
        }
      }
    } catch (error) {
      console.error("Ошибка при создании платежной опции:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Не удалось создать платежную опцию. Попробуйте позже.";
      toast.error(errorMessage);
    }
    fetchActiveApplications();
  };

  const formatNumber = (number) => {
    const num = parseFloat(number);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  // Добавляем обработчик для кнопки истории транзакций
  const handleTransactionHistoryClick = () => {
    setIsHeaderBalanceClicked(false); // Закрываем popup
    navigate("/user/transaction-history"); // Перенаправляем на страницу истории
  };

  // Обработчик клика по оверлею
  const handleOverlayClick = (e) => {
    // Проверяем, что клик был именно по оверлею, а не по содержимому сайдбаров
    if (e.target.classList.contains("blur-container")) {
      closeAllSidebars();
    }
  };

  const cryptoOptions = [{ value: "usdt", label: "USDT", icon: <SiTether /> }];

  const handleCryptoSelect = async (crypto) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "/api/crypto/get-usdt-address",
        {},
        { withCredentials: true }
      );

      if (response.data && response.data.address) {
        setSelectedCrypto(crypto);
        setWalletAddress(response.data.address);
        await updateBalance(response.data.balance || 0);
      }

      if (response.data && response.data.address) {
        setSelectedCrypto(crypto);
        setWalletAddress(response.data.address);
        setUsdtBalance(response.data.balance || null);
      } else {
        throw new Error("Некорректный ответ от сервера");
      }
    } catch (err) {
      console.error("Ошибка получения адреса:", err);
      setError(
        err.response?.data?.error ||
          "Не удалось получить адрес. Попробуйте позже."
      );
      toast.error("Ошибка при получении адреса кошелька");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success("Адрес скопирован");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Не удалось скопировать адрес");
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
      setUser((prevUser) => ({
        ...prevUser,
        walletStatus: data.walletStatus,
      }));

      if (data.walletStatus === 0) {
        setPaymentOptions((prevOptions) =>
          prevOptions.map((option) => ({
            ...option,
            isActive: false,
          }))
        );
      }

      return data.walletStatus;
    } catch (error) {
      console.error("Error toggling wallet:", error);
      toast.error("Ошибка при переключении кошелька");
      return null;
    }
  };

  const handleTurnOnOffClick = async () => {
    try {
      const newStatus = await toggleWallet();
      if (newStatus !== null) {
        toast.success(newStatus === 1 ? "Кошелек включен" : "Кошелек выключен");
        if (newStatus === 0) {
          setPaymentOptions((prevOptions) =>
            prevOptions.map((option) => ({
              ...option,
              isActive: false,
            }))
          );
        }
      }
    } catch (error) {
      console.error("Ошибка при переключении статуса кошелька:", error);
      toast.error("Не удалось изменить статус кошелька");
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post("https://mmrtest.ru/account/logout"); // Отправка запроса на выход
      // Очистка состояния пользователя в контексте
      setUser(null); // Предполагается, что setUser   — это функция для обновления состояния пользователя
      // Перенаправление на страницу входа и обновление страницы
      window.location.href = "/account/signin"; // Перенаправляем на страницу входа
    } catch (error) {
      console.error("Ошибка при выходе:", error);
      // Обработка ошибки, если необходимо
      alert("Ошибка при выходе. Пожалуйста, попробуйте еще раз.");
    }
  };

  const handleClosePopup = () => {
    setIsHeaderBalanceClicked(false);
  };

  const handleHeaderBalanceClick = (e) => {
    e.stopPropagation();
    if (!isHeaderBalanceClicked) {
      // Сначала устанавливаем состояние
      setIsHeaderBalanceClicked(true);
      // Используем setTimeout, чтобы дать время для рендера
      setTimeout(() => {
        if (popupRef.current) {
          popupRef.current.classList.add("visible");
          popupRef.current.classList.add("fade-in");
          popupRef.current.classList.remove("fade-out");
        }
      }, 0);
    } else {
      closePopup();
    }
  };

  const closePopup = () => {
    if (popupRef.current) {
      popupRef.current.classList.remove("fade-in");
      popupRef.current.classList.add("fade-out");
      setTimeout(() => {
        setIsHeaderBalanceClicked(false);
      }, 300);
    }
  };

  const handleDocumentClick = () => {
    setIsHeaderBalanceClicked(false);
  };

  // Обновляем обработчики открытия сайдбаров
  const handleTopUpClick = (e) => {
    e.stopPropagation();
    setIsTopUpOpen(true);
    setIsBlurred(true);
    setIsHeaderBalanceClicked(false);
  };

  // Функция для обновления баланса в рублях
  const updateRubBalance = (usdtAmount) => {
    if (usdtAmount !== null) {
      const rubAmount = (parseFloat(usdtAmount) * 90).toFixed(2);
      // Обновляем баланс пользователя в контексте
      setUser((prevUser) => ({
        ...prevUser,
        balance: rubAmount,
      }));
    }
  };

  const resetNotificationCounter = async () => {
    try {
      const response = await axios.post(
        "/api/notifications/reset-counter",
        {},
        {
          withCredentials: true, // Важно для отправки cookies
        }
      );

      if (response.data.success) {
        setUnreadNotifications(0);
      }
    } catch (error) {
      console.error("Ошибка при сбросе счетчика уведомлений:", error);
      if (error.response?.status === 401) {
        // Можно добавить редирект на страницу входа
        navigate("/account/signin");
      }
    }
  };

  const handleNotificationsClick = (e) => {
    e.stopPropagation();
    setIsNotificationsOpen(true);
    setIsBlurred(true);
    setIsHeaderBalanceClicked(false);
  };

  // Обновляем обработчики закрытия
  const handleCloseSidebar = () => {
    setIsTopUpOpen(false);
    setIsBlurred(false);
  };

  const updateBalance = async (newUsdtBalance) => {
    try {
      const parsedUsdtBalance = parseFloat(newUsdtBalance) || 0;
      const newRubBalance = parsedUsdtBalance * 90;

      await axios.post(
        "/api/update-balance",
        {
          usdtBalance: parsedUsdtBalance,
          rubBalance: newRubBalance,
        },
        {
          withCredentials: true,
        }
      );

      setUsdtBalance(parsedUsdtBalance);
      setRubBalance(newRubBalance);
      setUser((prevUser) => ({
        ...prevUser,
        balance: formatNumber(newRubBalance),
      }));

      // Кэшируем новый баланс
      localStorage.setItem(
        "userBalance",
        JSON.stringify({
          usdtBalance: parsedUsdtBalance,
          rubBalance: newRubBalance,
        })
      );
    } catch (error) {
      console.error("Ошибка при обновлении баланса:", error);
    }
  };

  useEffect(() => {
    const fetchBalanceAndNotifications = async () => {
      try {
        // Кэширование и обновление баланса
        const cachedBalance = localStorage.getItem("userBalance");
        if (cachedBalance) {
          const { usdtBalance: cachedUsdt, rubBalance: cachedRub } =
            JSON.parse(cachedBalance);
          setUsdtBalance(parseFloat(cachedUsdt) || 0);
          setRubBalance(parseFloat(cachedRub) || 0);
          setUser((prevUser) => ({
            ...prevUser,
            balance: formatNumber(cachedRub),
          }));
        }

        // Получение актуального баланса
        const balanceResponse = await axios.get("/api/get-balance", {
          withCredentials: true,
        });
        const parsedUsdtBalance =
          parseFloat(balanceResponse.data.usdtBalance) || 0;
        const parsedRubBalance =
          parseFloat(balanceResponse.data.rubBalance) || 0;

        // Обновляем состояния только если значения отличаются
        if (
          parsedUsdtBalance !== usdtBalance ||
          parsedRubBalance !== rubBalance
        ) {
          setUsdtBalance(parsedUsdtBalance);
          setRubBalance(parsedRubBalance);
          setUser((prevUser) => ({
            ...prevUser,
            balance: formatNumber(parsedRubBalance),
          }));

          // Кэшируем новые данные
          localStorage.setItem(
            "userBalance",
            JSON.stringify({
              usdtBalance: parsedUsdtBalance,
              rubBalance: parsedRubBalance,
            })
          );
        }

        // Получение уведомлений
        const notificationsResponse = await axios.get("/api/notifications", {
          withCredentials: true,
        });
        setNotifications(notificationsResponse.data);

        // Получение количества непрочитанных уведомлений
        const unreadResponse = await axios.get("/user/settings", {
          withCredentials: true,
        });
        setUnreadNotifications(unreadResponse.data.unreadNotifications);
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
      }
    };

    // Первоначальная загрузка
    fetchBalanceAndNotifications();

    // Интервал обновления
    const intervalId = setInterval(fetchBalanceAndNotifications, 30000);

    // Обработчик клика вне элементов
    const handleDocumentClick = (event) => {
      // Логика закрытия попапов и сайдбаров
      // ... (существующая логика)
    };

    document.addEventListener("mousedown", handleDocumentClick);

    // Очистка
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [setUser]); // Минимальный набор зависимостей

  const handleFullscreenImageClick = (e) => {
    e.stopPropagation(); // Останавливаем всплытие события для полноэкранного изображения
  };

  const handleCloseFullscreenImage = (e) => {
    // Проверяем, что клик именно по оверлею
    if (e.target.classList.contains("fullscreen-image-overlay")) {
      setIsImageFullscreen(false);
    }
  };

  useEffect(() => {
    const handleDocumentClick = (event) => {
      // Обработка popup баланса
      if (isHeaderBalanceClicked) {
        const popup = popupRef.current;
        const balanceButton = document.querySelector(".header_balance");

        if (popup && balanceButton) {
          if (
            !popup.contains(event.target) &&
            !balanceButton.contains(event.target)
          ) {
            closePopup();
          }
        }
      }

      // Получаем элементы сайдбаров и модальных окон
      const topUpSidebar = document.querySelector(".top_up_sidebar");
      const notificationsSidebar = document.querySelector(
        ".notifications_sidebar"
      );
      const accountSidebar = document.querySelector(".account_sidebar");
      const notificationModal = document.querySelector(".notification-modal");
      const notificationModalOverlay = document.querySelector(
        ".notification-modal-overlay"
      );

      // Проверка закрытия уведомлений
      if (isNotificationsOpen) {
        const isClickInsideSidebar =
          notificationsSidebar?.contains(event.target) ||
          notificationModal?.contains(event.target) ||
          notificationModalOverlay?.contains(event.target);

        if (!isClickInsideSidebar) {
          handleCloseNotifications();
        }
      }

      // Универсальная логика закрытия сайдбаров
      if (isTopUpOpen || isNotificationsOpen || isAccountSidebarOpen) {
        const isClickInsideSidebars =
          topUpSidebar?.contains(event.target) ||
          notificationsSidebar?.contains(event.target) ||
          accountSidebar?.contains(event.target) ||
          notificationModal?.contains(event.target) ||
          notificationModalOverlay?.contains(event.target);

        if (!isClickInsideSidebars) {
          closeAllSidebars();
        }
      }
    };

    // Функции загрузки данных
    const fetchBalance = async () => {
      try {
        // Кэширование и обновление баланса
        const cachedBalance = localStorage.getItem("userBalance");
        if (cachedBalance) {
          const { usdtBalance: cachedUsdt, rubBalance: cachedRub } =
            JSON.parse(cachedBalance);
          setUsdtBalance(parseFloat(cachedUsdt) || 0);
          setRubBalance(parseFloat(cachedRub) || 0);
          setUser((prevUser) => ({
            ...prevUser,
            balance: formatNumber(cachedRub),
          }));
        }

        const response = await axios.get("/api/get-balance", {
          withCredentials: true,
        });
        const parsedUsdtBalance = parseFloat(response.data.usdtBalance) || 0;
        const parsedRubBalance = parseFloat(response.data.rubBalance) || 0;

        setUsdtBalance(parsedUsdtBalance);
        setRubBalance(parsedRubBalance);
        setUser((prevUser) => ({
          ...prevUser,
          balance: formatNumber(parsedRubBalance),
        }));

        localStorage.setItem(
          "userBalance",
          JSON.stringify({
            usdtBalance: parsedUsdtBalance,
            rubBalance: parsedRubBalance,
          })
        );
      } catch (error) {
        console.error("Ошибка при получении баланса:", error);
      }
    };

    const fetchUnreadNotifications = async () => {
      try {
        const response = await axios.get("/user/settings", {
          withCredentials: true,
        });
        setUnreadNotifications(response.data.unreadNotifications);
      } catch (error) {
        console.error(
          "Ошибка при получении количества непрочитанных уведомлений:",
          error
        );
      }
    };

    const fetchNotifications = async () => {
      try {
        const response = await axios.get("/api/notifications", {
          withCredentials: true,
        });
        setNotifications(response.data);
      } catch (error) {
        console.error("Ошибка при получении уведомлений:", error);
        toast.error("Ошибка при получении уведомлений");
      }
    };

    // Обновление баланса в рублях
    const updateRubBalance = (usdtAmount) => {
      if (usdtAmount !== null) {
        const rubAmount = (parseFloat(usdtAmount) * 90).toFixed(2);
        setUser((prevUser) => ({
          ...prevUser,
          balance: rubAmount,
        }));
      }
    };

    // Вызов функций загрузки
    fetchBalance();
    fetchNotifications();
    fetchUnreadNotifications();

    // Обновление рублевого баланса
    if (usdtBalance !== null) {
      updateRubBalance(usdtBalance);
    }

    // Добавление и удаление обработчика клика
    document.addEventListener("mousedown", handleDocumentClick);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [
    setUser,
    isTopUpOpen,
    isNotificationsOpen,
    isAccountSidebarOpen,
    usdtBalance,
    isHeaderBalanceClicked,
    handleOutsideClick,
  ]);

  const navLinks = [
    { to: "/requests/active", label: "Заявки" },
    { to: "/", label: "Выплаты", onClick: handleWithdrawClick },
    { to: "/user/payments", label: "Реквизиты" },
    { to: "/user/settings", label: "Настройки" },
  ];

  return (
    <>
      <div onClick={handleOutsideClick}>
        <div className={`app-wrapper ${isBlurred ? "blurred" : ""}`}>
          <header className="header">
            <Link to="/requests" className="header_logo">
              <img src={Logo} alt="" />
            </Link>
            <div className="header_rs">
              <div className="turn_on_off" onClick={handleTurnOnOffClick}>
                <div className="header_on_off">
                  <div
                    className={`turn_btn ${
                      user?.walletStatus === 1 ? "on" : "off"
                    }`}
                  >
                    <button
                      type="button"
                      className={`on_off ${
                        user?.walletStatus === 1 ? "balance_on" : "balance_off"
                      }`}
                    />
                  </div>
                  <div className="balance_items">
                    <h2 className="balance_sum">
                      {user?.walletStatus === 1 ? "ВКЛ" : "ВЫКЛ"}
                    </h2>
                    <p className="balance_text">Статус кошелька</p>
                  </div>
                </div>
              </div>
              <div className="header_balance_container">
                <div
                  className="header_balance"
                  onClick={handleHeaderBalanceClick}
                >
                  <div className="header_section">
                    <div className="header_svg">
                      <svg width="26" height="26" viewBox="0 0 16 16">
                        <path
                          fill="currentColor"
                          d="M2 3.5A1.5 1.5 0 0 1 3.5 2H11a2 2 0 0 1 2 2v.268A2 2 0 0 1 14 6v6a2 2 0 0 1-2 2H4.5A2.5 2.5 0 0 1 2 11.5zm1 0a.5.5 0 0 0 .5.5H12a1 1 0 0 0-1-1H3.5a.5.5 0 0 0-.5.5M10.5 8a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1z"
                        />
                      </svg>
                    </div>
                    <div className="balance_items">
                      <h2 className="balance_sum">
                        <SiTether className="usdt-icon" />
                        {isBalanceVisible
                          ? formatNumber(usdtBalance)
                          : "***"}{" "}
                        {/* Проверяем состояние видимости */}
                      </h2>
                      <p className="balance_text">Баланс кошелька</p>
                    </div>
                    <div className="header_arrow_svg">
                      <svg width="14" height="14" viewBox="0 0 12 12">
                        <path
                          fill="currentColor"
                          d="M2.22 4.47a.75.75 0 0 1 1.06 0L6 7.19l2.72-2.72a.75.75 0 0 1 1.06 1.06L6.53 8.78a.75.75 0 0 1-1.06 0L2.22 5.53a.75.75 0 0 1 0-1.06"
                        />
                      </svg>
                    </div>
                    {isHeaderBalanceClicked && (
                      <div
                        ref={popupRef}
                        className={`balance_popup ${
                          isHeaderBalanceClicked ? "visible" : ""
                        }`}
                        onClick={(e) => e.stopPropagation()} // Добавьте этот обработчик
                      >
                        <div className="popup_header">
                          <h2 className="popup_balance">
                            {isBalanceVisible
                              ? `₽ ${user?.balance || "0.00"}`
                              : "₽ ***"}{" "}
                            {/* Отображаем баланс или звёздочки */}
                          </h2>
                          <button
                            className="popup_eye_icon"
                            onClick={toggleBalanceVisibility}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24">
                              <path
                                fill="currentColor"
                                d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                              />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                        </div>
                        <p className="popup_text">Общий баланс кошелька</p>
                        <div className="popup_btn">
                          <div className="popup_buttons">
                            <button
                              className="button_top_up"
                              onClick={handleTopUpClick}
                            >
                              Пополнить
                              <svg width="20" height="20" viewBox="0 0 52 52">
                                <path
                                  fill="currentColor"
                                  d="M26,0C11.664,0,0,11.663,0,26s11.664,26,26,26s26-11.663,26-26S40.336,0,26,0z M38.5,28H28v11c0,1.104-0.896,2-2,2s-2-0.896-2-2V28H13.5c-1.104,0-2-0.896-2-2s0.896-2,2-2H24V14c0-1.104,0.896-2,2-2s2,0.896,2,2v10h10.5c1.104,0,2,0.896,2,2S39.604,28,38.5,28z"
                                />
                              </svg>
                            </button>
                            <button>
                              Перевести
                              <svg id="Layer_1" viewBox="0 0 24 24">
                                <g>
                                  <circle
                                    cx="12"
                                    cy="12"
                                    fill="#ffffff1a"
                                    r="12"
                                  />
                                  <path
                                    transform="rotate(180 12 12)"
                                    d="m17 11h-7.6l3.3-3.3c.4-.4.4-1 0-1.4s-1-.4-1.4 0l-5 5c-.1.1-.2.2-.2.3-.1.2-.1.5 0 .8 0 .1.1.2.2.3l5 5c.4.4 1 .4 1.4 0 .4-.4.4-1 0-1.4l-3.3-3.3h7.6c.6 0 1-.4 1-1s-.5-1-1-1z"
                                    fill="#fff"
                                  />
                                </g>
                              </svg>
                            </button>
                          </div>
                          <button
                            className="full_width_button"
                            onClick={handleTransactionHistoryClick}
                          >
                            История транзакций
                            <svg viewBox="0 0 24 24">
                              <g transform="translate(-185.359 -90.903)">
                                <path
                                  d="m189.902 99.819c1.26-3.451 4.573-5.916 8.457-5.916 4.967 0 9 4.033 9 9s-4.033 9-9 9c-3.328 0-6.237-1.81-7.794-4.499-.276-.478-.113-1.09.365-1.367.477-.276 1.089-.113 1.366.365 1.211 2.092 3.474 3.501 6.063 3.501 3.863 0 7-3.137 7-7 0-3.864-3.137-7-7-7-3.217 0-5.93 2.174-6.748 5.132l1.752-1c.479-.274 1.09-.108 1.364.372.274.479.107 1.09-.372 1.364l-3.5 2c-.237.136-.519.168-.781.09s-.48-.259-.605-.502l-2-3.903c-.252-.491-.057-1.094.434-1.346s1.094-.057 1.346.434zm9.457 2.67 2.707 2.707c.39.39.39 1.024 0 1.414s-1.024.39-1.414 0l-3-3c-.188-.188-.293-.442-.293-.707v-4c0-.552.448-1 1-1s1 .448 1 1z"
                                  fill="#ffffff"
                                />
                              </g>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="header_account_options">
                <div
                  className="header_notifications header_section"
                  onClick={handleNotificationsClick}
                >
                  <FaBell size={20} />
                  {unreadNotifications > 0 && (
                    <span className="notification-badge">
                      {unreadNotifications}
                    </span>
                  )}
                </div>

                <div
                  className="header_account header_section"
                  onClick={handleAccountClick}
                >
                  <FaUser size={20} />
                  <span style={{ marginLeft: "10px" }}>{user?.login}</span>
                </div>
              </div>
            </div>
          </header>
          <nav className="wrapper">
            <div className="wrapper_buttons">
              {navLinks.map((link, index) => (
                <Link
                  key={index} // Используйте уникальный идентификатор, если он доступен
                  to={link.to}
                  onClick={link.onClick}
                  className="wrapper_button"
                >
                  {link.label}
                </Link>
              ))}
              {user && user.role === "admin" && (
                <Link to="/users/notify" className="wrapper_button admin-link">
                  Панель администратора
                </Link>
              )}
            </div>
          </nav>
        </div>

        {isBlurred && (
          <div
            className="blur-container"
            onClick={() => {
              setIsTopUpOpen(false);
              setIsNotificationsOpen(false);
              setIsAccountSidebarOpen(false);
              setIsBlurred(false);
            }}
          />
        )}

        {isWithdrawOpen && (
          <div className="withdraw-modal" onClick={handleCloseWithdraw}>
            <div
              className="withdraw-content"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Вывод средств</h3>
              <input
                type="number"
                placeholder="Введите сумму"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                autoFocus
              />
              <div className="withdraw-buttons">
                <button
                  className="withdraw-submit"
                  onClick={handleWithdrawSubmit}
                >
                  Оплатить
                </button>
                <button
                  className="withdraw-cancel"
                  onClick={handleCloseWithdraw}
                >
                  Отменить
                </button>
              </div>
            </div>
          </div>
        )}

        <div
          className={`notifications_sidebar ${
            isNotificationsOpen ? "open" : ""
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="notifications_content">
            <div className="notifications_header">
              <h2>Уведомления</h2>
              <button
                className="close_button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseNotifications(e);
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                  />
                </svg>
              </button>
            </div>
            <div className="notifications_list">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className="notification_item"
                  onClick={(e) => handleNotificationClick(e, notification)}
                >
                  <div className="notification_title">{notification.title}</div>
                  <div
                    className="notification_preview"
                    dangerouslySetInnerHTML={{ __html: notification.message }}
                  />
                  {notification.image && (
                    <div className="notification_thumbnail">
                      <img
                        src={`https://mmrtest.ru${notification.image}`}
                        alt="Notification image"
                        className="thumbnail-image"
                      />
                    </div>
                  )}
                  <small className="notification_meta">
                    {new Date(notification.createdAt).toLocaleString()} -{" "}
                    {notification.createdBy?.login || "Unknown Sender"}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Модальное окно с отдельным уведомлением */}
        {selectedNotification && (
          <div
            className={`notification-modal-overlay ${
              isClosing ? "closing" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (!isImageFullscreen) {
                handleCloseModal(e);
              }
            }}
          >
            <div
              className={`notification-modal ${isClosing ? "closing" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>{selectedNotification.title}</h3>
              <div
                className="notification-content"
                dangerouslySetInnerHTML={{
                  __html: selectedNotification.message,
                }}
              />
              {selectedNotification.image && (
                <div className="notification-image-container">
                  <img
                    src={`http://https://mmrtest.ru:8000${selectedNotification.image}`}
                    alt="Notification image"
                    className="modal_img"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsImageFullscreen(true);
                    }}
                    style={{ cursor: "pointer" }}
                  />
                </div>
              )}
              <small>
                {new Date(selectedNotification.createdAt).toLocaleString()} -{" "}
                {selectedNotification.createdBy?.login || "Unknown Sender"}
              </small>
              <button
                className="notification-modal-close"
                onClick={handleCloseModal}
              >
                Закрыть
              </button>
            </div>
          </div>
        )}

        {/* Полноэкранный просмотр изображения */}
        {isImageFullscreen && selectedNotification?.image && (
          <div
            className={`fullscreen-image-overlay ${
              isClosingImage ? "closing" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setIsClosingImage(true);
              setTimeout(() => {
                setIsImageFullscreen(false);
                setIsClosingImage(false);
              }, 300);
            }}
          >
            <div
              className={`fullscreen-image-container ${
                isClosingImage ? "closing" : ""
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={`http://https://mmrtest.ru:8000${selectedNotification.image}`}
                alt="Fullscreen view"
                className="fullscreen-image"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                className="fullscreen-close-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsClosingImage(true);
                  setTimeout(() => {
                    setIsImageFullscreen(false);
                    setIsClosingImage(false);
                  }, 300);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  className="custom-close-icon"
                >
                  <path
                    fill="white"
                    d="M12 10.586l4.293-4.293 1.414 1.414L13.414 12l4.293 4.293-1.414 1.414L12 13.414l-4.293 4.293-1.414-1.414L10.586 12 6.293 7.707 7.707 6.293 12 10.586z"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className={`top_up_sidebar ${isTopUpOpen ? "open" : ""}`}>
          <div className="top_up_content">
            <div className="top_up_header">
              <h2>Пополнение</h2>
              <button className="close_button" onClick={handleCloseSidebar}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path
                    fill="currentColor "
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                  />
                </svg>
              </button>
            </div>
            <div className="crypto_options">
              {cryptoOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleCryptoSelect(option.value)}
                  className={`crypto_button ${
                    selectedCrypto === option.value ? "selected" : ""
                  }`}
                >
                  <span className="crypto_icon">{option.icon}</span>
                  <span className="crypto_label">{option.label}</span>
                </button>
              ))}
            </div>
            {isLoading ? (
              <div className="loading">Загрузка адреса...</div>
            ) : error ? (
              <div className="error">{error}</div>
            ) : (
              selectedCrypto && (
                <div className="wallet_info">
                  <div className="wallet_header">
                    <h4>
                      Адрес для пополнения{" "}
                      {
                        cryptoOptions.find(
                          (opt) => opt.value === selectedCrypto
                        ).label
                      }
                      :
                    </h4>
                    <span className="crypto_icon_small">
                      {
                        cryptoOptions.find(
                          (opt) => opt.value === selectedCrypto
                        ).icon
                      }
                    </span>
                  </div>
                  <div className="wallet_address">
                    <p>{walletAddress}</p>
                    <button
                      className="copy_button"
                      onClick={() => copyToClipboard(walletAddress)}
                      title={isCopied ? "Скопировано!" : "Копировать адрес"}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {isCopied ? (
                          <path d="M20 6L9 17l-5-5" />
                        ) : (
                          <>
                            <rect
                              x="9"
                              y="9"
                              width="13"
                              height="13"
                              rx="2"
                              ry="2"
                            />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
              )
            )}
            {selectedCrypto === "usdt" && usdtBalance !== null && (
              <div className="wallet-balance">
                <p>Баланс в USDT: {formatNumber(usdtBalance)} USDT</p>
                <p>Баланс в RUB: ₽ {formatNumber(rubBalance)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Аккаунт сайдбар */}
        <div
          className={`account_sidebar ${isAccountSidebarOpen ? "open" : ""}`}
        >
          <div className="account_content">
            <div className="account_header">
              <h2>Аккаунт</h2>
              <button className="close_button" onClick={handleCloseAccount}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                  />
                </svg>
              </button>
            </div>
            <div className="account_info">
              <div className="account_avatar">
                <FaUser size={50} />
              </div>
              <div className="account_details">
                <div className="account_item">
                  <span className="account_label">ID:</span>
                  <span className="account_value">{user?._id}</span>
                </div>
                <div className="account_item">
                  <span className="account_label">Логин:</span>
                  <span className="account_value">{user?.login}</span>
                </div>
              </div>
              <button className="logout_button" onClick={handleLogout}>
                Выйти из аккаунта
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
