import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { UserContext } from "../../context/UserContext";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

// BANKS LOGOS
import sberLogo from "../assets/banks/sber.png";
import tinkoffLogo from "../assets/banks/tinkoff.png";
import alfaLogo from "../assets/banks/alfabank.png";
import otpLogo from "../assets/banks/OTPBank.png";
import rshbLogo from "../assets/banks/rshb.png";
import solidarnostLogo from "../assets/banks/solidarnost.png";

const ROWS_PER_PAGE = 8;

const AllTables = () => {
  const { user } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [allApplications, setAllApplications] = useState([]);
  const [error, setError] = useState(null);

  // Состояния для таблиц
  const [activeTable, setActiveTable] = useState(false);
  const [processingTable, setProcessingTable] = useState(false);
  const [closedTable, setClosedTable] = useState(false);
  const [canceledTable, setCanceledTable] = useState(false);
  const [allTable, setAllTable] = useState(false);

  // Первый useEffect для обработки навигации и начальной загрузки
  useEffect(() => {
    const handlePopState = (event) => {
      const tableName = event.state?.table || "active";
      setActiveTable(tableName === "active");
      setProcessingTable(tableName === "processing");
      setClosedTable(tableName === "closed");
      setCanceledTable(tableName === "canceled");
      setAllTable(tableName === "all");
    };

    window.addEventListener("popstate", handlePopState);

    const currentPath = window.location.pathname;
    const currentTable = currentPath.split("/").pop();

    if (
      ["active", "processing", "closed", "canceled", "all"].includes(
        currentTable
      )
    ) {
      handlePopState({ state: { table: currentTable } });
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Второй useEffect для сохранения состояний в localStorage
  useEffect(() => {
    localStorage.setItem("activeTable", JSON.stringify(activeTable));
    localStorage.setItem("processingTable", JSON.stringify(processingTable));
    localStorage.setItem("closedTable", JSON.stringify(closedTable));
    localStorage.setItem("canceledTable", JSON.stringify(canceledTable));
    localStorage.setItem("allTable", JSON.stringify(allTable));
  }, [activeTable, processingTable, closedTable, canceledTable, allTable]);

  // Обработчики для кнопок
  const handleActiveTableClick = () => {
    setActiveTable(true);
    setProcessingTable(false);
    setClosedTable(false);
    setCanceledTable(false);
    setAllTable(false);
    navigate("/requests/active");
    fetchApplications("active");
  };

  const handleProcessingTableClick = () => {
    setActiveTable(false);
    setProcessingTable(true);
    setClosedTable(false);
    setCanceledTable(false);
    setAllTable(false);
    navigate("/requests/processing");
    fetchApplications("processing");
  };

  const handleClosedTableClick = () => {
    setActiveTable(false);
    setProcessingTable(false);
    setClosedTable(true);
    setCanceledTable(false);
    setAllTable(false);
    navigate("/requests/closed");
    fetchApplications("closed");
  };

  const handleCanceledTableClick = () => {
    setActiveTable(false);
    setProcessingTable(false);
    setClosedTable(false);
    setCanceledTable(true);
    setAllTable(false);
    navigate("/requests/canceled");
    fetchApplications("canceled");
  };

  const handleAllTableClick = () => {
    setActiveTable(false);
    setProcessingTable(false);
    setClosedTable(false);
    setCanceledTable(false);
    setAllTable(true);
    navigate("/requests/all");
    fetchApplications("all");
  };

  // Состояния для данных
  const [loading, setLoading] = useState(true);

  // Функция загрузки данных
  const fetchApplications = async (type) => {
    setLoading(true);
    try {
      const userId = user._id; // Получаем userId из контекста пользователя

      const response = await axios.get(`/api/applications?type=${type}`, {
        params: { userId },
      });

      console.log("Полученные данные:", response.data); // Логируем полученные данные

      // Обновляем состояние в зависимости от типа
      if (type === "active") {
        setActiveTableData(response.data);
      } else if (type === "processing") {
        setProcessingTableData(response.data); // Устанавливаем данные для заявок на проверку
      } else if (type === "closed") {
        setClosedTableData(response.data);
      } else if (type === "canceled") {
        setCanceledTableData(response.data);
      } else if (type === "all") {
        setAllApplications(response.data);
      }
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    } finally {
      setLoading(false);
    }
  };

  // При монтировании компонента проверяем URL
  useEffect(() => {
    const path = location.pathname;
    const currentTable = path.split("/").pop();

    // Сбрасываем все состояния
    setActiveTable(false);
    setProcessingTable(false);
    setClosedTable(false);
    setCanceledTable(false);
    setAllTable(false);

    // Устанавливаем состояние в зависимости от URL и загружаем данные
    switch (currentTable) {
      case "active":
        setActiveTable(true);
        fetchApplications("active");
        break;
      case "processing":
        setProcessingTable(true);
        fetchApplications("processing");
        break;
      case "closed":
        setClosedTable(true);
        fetchApplications("closed");
        break;
      case "canceled":
        setCanceledTable(true);
        fetchApplications("canceled");
        break;
      default:
        setAllTable(true);
        fetchApplications("all");
    }
  }, [location.pathname]);

  const [processingTableData, setProcessingTableData] = useState([]);
  const [activeTableData, setActiveTableData] = useState([]); // Данные для активных заявок
  const [closedTableData, setClosedTableData] = useState([]); // Данные для проверяемых заявок
  const [canceledTableData, setCanceledTableData] = useState([]); // Данные для закрытых заявок
  const [allTableData, setAllTableData] = useState([]); // Данные для отмененных заявок

  const [currentPageActive, setCurrentPageActive] = useState(1);
  const [currentPageProcessing, setCurrentPageProcessing] = useState(1);
  const [currentPageClosed, setCurrentPageClosed] = useState(1);
  const [currentPageCanceled, setCurrentPageCanceled] = useState(1);

  const [currentPageAll, setCurrentPageAll] = useState(1);

  // Функция для генерации пустых строк
  const generateEmptyRows = (currentRows) => {
    const emptyRows = [];
    for (let i = currentRows.length; i < ROWS_PER_PAGE; i++) {
      emptyRows.push({ id: `empty-${i}`, isEmpty: true });
    }
    return emptyRows;
  };

  // Вычисляем общее количество страниц
  const totalPagesActive = Math.ceil(activeTableData.length / ROWS_PER_PAGE);

  // Получаем заявки для текущей страницы
  const startIndexActive = (currentPageActive - 1) * ROWS_PER_PAGE;
  const currentActiveApplications = activeTableData.slice(
    startIndexActive,
    startIndexActive + ROWS_PER_PAGE
  );

  const handlePageChangeActive = (newPage) => {
    if (newPage >= 1 && newPage <= totalPagesActive) {
      setCurrentPageActive(newPage);
    }
  };

  const handlePageChangeProcessing = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= Math.ceil(processingTableData.length / ROWS_PER_PAGE)
    ) {
      setCurrentPageProcessing(newPage);
    }
  };

  const handlePageChangeClosed = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= Math.ceil(closedTableData.length / ROWS_PER_PAGE)
    ) {
      setCurrentPageClosed(newPage);
    }
  };

  const handlePageChangeCanceled = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= Math.ceil(canceledTableData.length / ROWS_PER_PAGE)
    ) {
      setCurrentPageCanceled(newPage);
    }
  };

  // Обработчик изменения страницы
  const handlePageChangeAll = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPageAll(newPage);
    }
  };

  useEffect(() => {
    const fetchActiveApplications = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/applications?type=active", {
          withCredentials: true,
        });
        setActiveTableData(response.data); // Устанавливаем данные для активных заявок
      } catch (error) {
        console.error("Ошибка при получении активных заявок:", error);
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Не удалось загрузить активные заявки";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false); // Сбрасываем состояние загрузки
      }
    };

    // Функция для загрузки закрытых заявок
    const fetchClosedApplications = async () => {
      setLoading(true); // Устанавливаем состояние загрузки
      try {
        const response = await axios.get("/api/applications?type=closed", {
          withCredentials: true,
        });
        setClosedTableData(response.data); // Устанавливаем данные для закрытых заявок
      } catch (error) {
        console.error("Ошибка при получении закрытых заявок:", error);
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Не удалось загрузить закрытые заявки";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false); // Сбрасываем состояние загрузки
      }
    };

    const fetchAllApplications = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/applications?type=all", {
          withCredentials: true,
        });
        setAllApplications(response.data); // Устанавливаем данные для всех заявок
      } catch (error) {
        console.error("Ошибка при получении всех заявок:", error);
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Не удалось загрузить все заявки";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false); // Сбрасываем состояние загрузки
      }
    };

    fetchActiveApplications();
    fetchClosedApplications();
    fetchAllApplications(); // Загружаем закрытые заявки при монтировании компонента
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case "active":
        return "active"; // Класс для активных заявок
      case "completed":
        return "completed"; // Класс для завершенных заявок
      case "canceled":
      case "Отменено": // Добавляем обработку для русского текста
        return "canceled"; // Класс для отмененных заявок
      case "На проверке":
        return "processing"; // Класс для заявок на проверке
      default:
        return ""; // Возвращаем пустую строку для нераспознанных статусов
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "Активный";
      case "processing":
        return "На проверке";
      case "completed":
        return "Закрыто";
      case "canceled":
        return "Отменено";
      default:
        return status; // Возвращаем статус по умолчанию, если он не распознан
    }
  };

  const getBankLogo = (bankName) => {
    const bankLogos = {
      СБЕР: sberLogo,
      ТИНЬКОФФ: tinkoffLogo,
      АЛЬФА: alfaLogo,
      ОТП: otpLogo,
      РСХБ: rshbLogo,
      СОЛИДАРНОСТЬ: solidarnostLogo,
    };

    return bankLogos[bankName] || "";
  };

  // Вычисляем общее количество страниц
  const totalPages = Math.ceil(allApplications.length / ROWS_PER_PAGE);

  // Получаем заявки для текущей страницы
  const startIndex = (currentPageAll - 1) * ROWS_PER_PAGE;
  const currentApplications = allApplications.slice(
    startIndex,
    startIndex + ROWS_PER_PAGE
  );

  const handleConfirm = async (id) => {
    try {
      // Отправляем запрос на сервер для обновления статуса
      const response = await axios.patch(`/api/applications/${id}`, {
        status: "completed",
      });

      // Обновляем состояние в зависимости от ответа
      if (response.status === 200) {
        // Обновляем данные в таблице
        setProcessingTableData((prevData) =>
          prevData.map((row) =>
            row.id === id ? { ...row, status: "completed" } : row
          )
        );
        toast.success("Заявка успешно закрыта.");
      }
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error);
      toast.error("Ошибка при обновлении статуса.");
    }
  };

  const handleCancel = async (id) => {
    try {
      // Отправляем запрос на сервер для обновления статуса
      const response = await axios.patch(`/api/applications/${id}`, {
        status: "canceled",
      });

      // Обновляем состояние в зависимости от ответа
      if (response.status === 200) {
        // Обновляем данные в таблице
        setProcessingTableData((prevData) =>
          prevData.map((row) =>
            row.id === id ? { ...row, status: "canceled" } : row
          )
        );
        toast.success("Заявка успешно отменена.");
      }
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error);
      toast.error("Ошибка при обновлении статуса.");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return ""; 
    }
    
    // Добавляем 3 часа к времени
    date.setUTCHours(date.getUTCHours() + 3);
    
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    
    return `${day}.${month} ${hours}:${minutes}`;
  };

  return (
    <>
      <div className="tables">
        <div className="applications_buttons">
          <div className="applications_options">
            <button
              className={`buttons ${activeTable ? "button_active" : ""}`}
              onClick={handleActiveTableClick}
            >
              Активные
            </button>
            <button
              className={`buttons ${processingTable ? "button_active" : ""}`}
              onClick={handleProcessingTableClick}
            >
              Проверки
            </button>
            <button
              className={`buttons ${closedTable ? "button_active" : ""}`}
              onClick={handleClosedTableClick}
            >
              Закрытые
            </button>
            <button
              className={`buttons ${canceledTable ? "button_active" : ""}`}
              onClick={handleCanceledTableClick}
            >
              Отменено
            </button>
            <button
              className={`buttons ${allTable ? "button_active" : ""}`}
              onClick={handleAllTableClick}
            >
              Все заявки
            </button>
          </div>
        </div>

        {loading ? (
          <div className="table_preloader">
            <section>
              <span className="loader-26"></span>
            </section>
          </div>
        ) : (
          <>
            {activeTable && (
              <div
                className={`applications_table ${activeTable ? "" : "hidden"}`}
              >
                <table>
                  <thead>
                    <tr>
                      <th>ID заявки</th>
                      <th>Сумма ₽</th>
                      <th>Реквизиты</th>
                      <th>Статус</th>
                      <th>Курс Сумма</th>
                      <th>Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentActiveApplications.length > 0 ? (
                      currentActiveApplications.map((row) => (
                        <tr key={row.id}>
                          <td>{row.id}</td> {/* Отображаем ID заявки */}
                          <td>{row.sum}</td> {/* Отображаем сумму */}
                          <td>
                            <div className="bank-requisites">
                              <img
                                src={getBankLogo(row.bank)}
                                alt={`${row.bank} logo`}
                                className="bank-logo"
                              />
                              <span>{row.botRequisites}</span>{" "}
                              {/* Отображаем реквизиты */}
                            </div>
                          </td>
                          <td className={getStatusClass(row.status)}>
                            {row.status === "active" ? "Активный" : "Закрыто"}
                          </td>{" "}
                          {/* Отображаем статус с соответствующим классом */}
                          <td>{row.course}</td> {/* Отображаем курс суммы */}
                          <td>{formatDate(row.timestamp)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          style={{ textAlign: "center", height: "45px" }}
                        >
                          Нет активных заявок
                        </td>
                      </tr>
                    )}
                    {/* Добавляем пустые строки */}
                    {currentActiveApplications.length < 8 &&
                      Array.from({
                        length: 8 - currentActiveApplications.length,
                      }).map((_, index) => (
                        <tr key={`empty-${index}`} className="empty-row">
                          <td colSpan="6" style={{ height: "45px" }}></td>{" "}
                          {/* Пустая строка */}
                        </tr>
                      ))}
                  </tbody>
                </table>
                <div className="pagination">
                  <p>
                    {currentPageActive} /{" "}
                    {Math.max(
                      1,
                      Math.ceil(activeTableData.length / ROWS_PER_PAGE)
                    )}
                  </p>
                  <div>
                    <button
                      className="pagination_button"
                      onClick={() =>
                        handlePageChangeActive(currentPageActive - 1)
                      }
                      disabled={currentPageActive === 1}
                    >
                      ←
                    </button>
                    <button
                      className="pagination_button"
                      onClick={() =>
                        handlePageChangeActive(currentPageActive + 1)
                      }
                      disabled={
                        currentPageActive ===
                        Math.max(
                          1,
                          Math.ceil(activeTableData.length / ROWS_PER_PAGE)
                        )
                      }
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {processingTable && (
              <div
                className={`applications_table ${
                  processingTable ? "" : "hidden"
                }`}
              >
                <table>
                  <thead>
                    <tr>
                      <th>ID заявки</th>
                      <th>Сумма ₽</th>
                      <th>Реквизиты</th>
                      <th>Статус</th>
                      <th>Курс Сумма</th>
                      <th>Дата</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processingTableData.length > 0 ? (
                      processingTableData
                        .slice(
                          (currentPageProcessing - 1) * ROWS_PER_PAGE,
                          currentPageProcessing * ROWS_PER_PAGE
                        )
                        .map((row) => (
                          <tr key={row.id}>
                            <td>{row.id}</td>
                            <td>{row.sum}</td>
                            <td>
                              <div className="bank-requisites">
                                <img
                                  src={getBankLogo(row.bank)}
                                  alt={`${row.bank} logo`}
                                  className="bank-logo"
                                />
                                <span>{row.botRequisites}</span>
                              </div>
                            </td>
                            <td className={getStatusClass(row.status)}>
                              {getStatusText(row.status)}
                            </td>
                            <td>{row.course}</td>
                            <td>{formatDate(row.timestamp)}</td>
                            <td>
                              <button
                                className="checking_button confirm"
                                onClick={() => handleConfirm(row.id)}
                              >
                                ✔️
                              </button>
                              <button
                                className="checking_button cancel"
                                onClick={() => handleCancel(row.id)}
                              >
                                ❌
                              </button>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center" }}>
                          Нет заявок на проверке
                        </td>
                      </tr>
                    )}
                    {/* Добавляем пустые строки для выравнивания таблицы */}
                    {processingTableData.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ height: "45px" }}></td>
                      </tr>
                    )}
                    {processingTableData.length < 7 &&
                      Array.from({
                        length: 7 - processingTableData.length,
                      }).map((_, index) => (
                        <tr key={`empty-${index}`} className="empty-row">
                          <td colSpan="7" style={{ height: "45px" }}></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <div className="pagination">
                  <p>
                    {currentPageProcessing} /{" "}
                    {Math.max(
                      1,
                      Math.ceil(
                        processingTableData.filter(
                          (row) => row.status === "pending"
                        ).length / ROWS_PER_PAGE
                      )
                    )}
                  </p>
                  <div>
                    <button
                      className="pagination_button"
                      onClick={() =>
                        handlePageChangeProcessing(currentPageProcessing - 1)
                      }
                      disabled={currentPageProcessing === 1}
                    >
                      ←
                    </button>
                    <button
                      className="pagination_button"
                      onClick={() =>
                        handlePageChangeProcessing(currentPageProcessing + 1)
                      }
                      disabled={
                        currentPageProcessing ===
                        Math.max(
                          1,
                          Math.ceil(
                            processingTableData.filter(
                              (row) => row.status === "pending"
                            ).length / ROWS_PER_PAGE
                          )
                        )
                      }
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {closedTable && (
              <div
                className={`applications_table ${closedTable ? "" : "hidden"}`}
              >
                <table>
                  <thead>
                    <tr>
                      <th>ID заявки</th>
                      <th>Сумма ₽</th>
                      <th>Реквизиты</th>
                      <th>Статус</th>
                      <th>Курс Сумма</th>
                      <th>Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closedTableData.length > 0 ? (
                      closedTableData.map((row) => (
                        <tr key={row.id}>
                          <td>{row.id}</td>
                          <td>{row.sum}</td>
                          <td>
                            <div className="bank-requisites">
                              <img
                                src={getBankLogo(row.bank)}
                                alt={`${row.bank} logo`}
                                className="bank-logo"
                              />
                              <span>{row.botRequisites}</span>
                            </div>
                          </td>
                          <td className={getStatusClass(row.status)}>
                            {row.status === "completed"
                              ? "Закрыто"
                              : row.status === "canceled"
                              ? "Отменено"
                              : row.status}
                          </td>
                          <td>{row.course}</td>
                          <td>{formatDate(row.timestamp)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center" }}>
                          Нет закрытых заявок
                        </td>
                      </tr>
                    )}
                    {closedTableData.length < 8 &&
                      Array.from({ length: 8 - closedTableData.length }).map(
                        (_, index) => (
                          <tr key={`empty-${index}`} className="empty-row">
                            <td colSpan="6" style={{ height: "45px" }}></td>
                          </tr>
                        )
                      )}
                  </tbody>
                </table>
                <div className="pagination">
                  <p>
                    {currentPageClosed} /{" "}
                    {Math.max(
                      1,
                      Math.ceil(closedTableData.length / ROWS_PER_PAGE)
                    )}
                  </p>
                  <div>
                    <button
                      className="pagination_button"
                      onClick={() =>
                        handlePageChangeClosed(currentPageClosed - 1)
                      }
                      disabled={currentPageClosed === 1}
                    >
                      ←
                    </button>
                    <button
                      className="pagination_button"
                      onClick={() =>
                        handlePageChangeClosed(currentPageClosed + 1)
                      }
                      disabled={
                        currentPageClosed ===
                        Math.max(
                          1,
                          Math.ceil(closedTableData.length / ROWS_PER_PAGE)
                        )
                      }
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {canceledTable && (
              <div
                className={`applications_table ${
                  canceledTable ? "" : "hidden"
                }`}
              >
                <table>
                  <thead>
                    <tr>
                      <th>ID заявки</th>
                      <th>Сумма ₽</th>
                      <th>Реквизиты</th>
                      <th>Статус</th>
                      <th>Курс Сумма</th>
                      <th>Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {canceledTableData.length > 0 ? (
                      canceledTableData
                        .slice(
                          (currentPageCanceled - 1) * ROWS_PER_PAGE,
                          currentPageCanceled * ROWS_PER_PAGE
                        )
                        .map((row) => (
                          <tr key={row.id}>
                            <td>{row.id}</td>
                            <td>{row.sum}</td>
                            <td>
                              <div className="bank-requisites">
                                <img
                                  src={getBankLogo(row.bank)}
                                  alt={`${row.bank} logo`}
                                  className="bank-logo"
                                />
                                <span>{row.botRequisites}</span>
                              </div>
                            </td>
                            <td className={getStatusClass(row.status)}>
                              {getStatusText(row.status)}
                            </td>
                            <td>{row.course}</td>
                            <td>{formatDate(row.timestamp)}</td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center" }}>
                          Нет отмененных заявок
                        </td>
                      </tr>
                    )}
                    {/* Добавляем пустые строки для выравнивания таблицы */}
                    {canceledTableData.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ height: "45px" }}></td>
                      </tr>
                    )}
                    {canceledTableData.length < 7 &&
                      Array.from({ length: 7 - canceledTableData.length }).map(
                        (_, index) => (
                          <tr key={`empty-${index}`} className="empty-row">
                            <td colSpan="6" style={{ height: "45px" }}></td>
                          </tr>
                        )
                      )}
                  </tbody>
                </table>
                <div className="pagination">
                  <p>
                    {currentPageCanceled} /{" "}
                    {Math.max(
                      1,
                      Math.ceil(canceledTableData.length / ROWS_PER_PAGE)
                    )}
                  </p>
                  <div>
                    <button
                      className="pagination_button"
                      onClick={() =>
                        handlePageChangeCanceled(currentPageCanceled - 1)
                      }
                      disabled={currentPageCanceled === 1}
                    >
                      ←
                    </button>
                    <button
                      className="pagination_button"
                      onClick={() =>
                        handlePageChangeCanceled(currentPageCanceled + 1)
                      }
                      disabled={
                        currentPageCanceled ===
                        Math.max(
                          1,
                          Math.ceil(canceledTableData.length / ROWS_PER_PAGE)
                        )
                      }
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {allTable && (
              <div className={`applications_table ${allTable ? "" : "hidden"}`}>
                <table>
                  <thead>
                    <tr>
                      <th>ID заявки</th>
                      <th>Сумма ₽</th>
                      <th>Реквизиты</th>
                      <th>Статус</th>
                      <th>Курс Сумма</th>
                      <th>Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentApplications.length > 0 ? (
                      currentApplications.map((row) => (
                        <tr key={row.id}>
                          <td>{row.id}</td> {/* Отображаем ID заявки */}
                          <td>{row.sum}</td> {/* Отображаем сумму */}
                          <td>
                            <div className="bank-requisites">
                              <img
                                src={getBankLogo(row.bank)}
                                alt={`${row.bank} logo`}
                                className="bank-logo"
                              />
                              <span>{row.botRequisites}</span>{" "}
                              {/* Отображаем реквизиты */}
                            </div>
                          </td>
                          <td className={getStatusClass(row.status)}>
                            {getStatusText(row.status)}
                          </td>{" "}
                          {/* Отображаем статус */}
                          <td>{row.course}</td> {/* Отображаем курс суммы */}
                          <td>{formatDate(row.timestamp)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center" }}>
                          Нет заявок
                        </td>
                      </tr>
                    )}
                    {/* Добавляем пустые строки для выравнивания таблицы */}
                    {currentApplications.length < ROWS_PER_PAGE &&
                      Array.from({
                        length: 8 - currentApplications.length,
                      }).map((_, index) => (
                        <tr key={`empty-${index}`} className="empty-row">
                          <td colSpan="6" style={{ height: "45px" }}></td>{" "}
                          {/* Пустая строка */}
                        </tr>
                      ))}
                  </tbody>
                </table>
                <div className="pagination">
                  <p>
                    {currentPageAll} / {totalPages}
                  </p>
                  <div>
                    <button
                      className="pagination_button"
                      onClick={() => handlePageChangeAll(currentPageAll - 1)}
                      disabled={currentPageAll === 1}
                    >
                      ←
                    </button>
                    <button
                      className="pagination_button"
                      onClick={() => handlePageChangeAll(currentPageAll + 1)}
                      disabled={currentPageAll === totalPages}
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default AllTables;
