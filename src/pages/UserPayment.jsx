import { useState, useEffect, useCallback, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { UserContext } from "../../context/UserContext";
import Header from "./Header";
import "./css/UserPayment.css";
import BankLogo from "../components/BankLogo";
import CustomSelect from "../components/CustomSelect";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
// Импорт логотипов
import sberLogo from "../assets/banks/sber.png";
import tinkoffLogo from "../assets/banks/tinkoff.png";
import alfaLogo from "../assets/banks/alfabank.png";
import otpLogo from "../assets/banks/OTPBank.png";
import rshbLogo from "../assets/banks/rshb.png";
import solidarnostLogo from "../assets/banks/solidarnost.png";

import mmr_logo from "../assets/mmr_logo.png";

const ROWS_PER_PAGE = 8; // Количество строк на странице

function UserPayments() {
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    id: null,
  });

  const banks = [
    { id: 1, name: "СБЕР", logo: sberLogo },
    { id: 2, name: "ТИНЬКОФФ", logo: tinkoffLogo },
    { id: 3, name: "АЛЬФА", logo: alfaLogo },
    { id: 4, name: "ОТП", logo: otpLogo },
    { id: 5, name: "РСХБ", logo: rshbLogo },
    { id: 6, name: "СОЛИДАРНОСТЬ", logo: solidarnostLogo },
  ];

  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const rowsPerPage = 10;
  const [selectedBank, setSelectedBank] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [editPaymentOption, setEditPaymentOption] = useState(null);

  // Функция для закрытия модального окна добавления реквизита
  const handleCloseAddForm = () => {
    setIsClosing(true); // Начинаем анимацию закрытия
    setTimeout(() => {
      setShowAddForm(false); // Скрываем окно после завершения анимации
      setIsClosing(false); // Сбрасываем состояние анимации
    }, 300); // Время задержки должно совпадать с длительностью анимации
  };

  const handleEditPaymentOption = (option) => {
    setEditPaymentOption(option);
    setShowAddForm(true); // Показываем форму добавления
    setSelectedBank(option.bank); // Устанавливаем выбранный банк
  };

  // Функция для закрытия модального окна подтверждения удаления
  const handleCloseDeleteConfirmation = () => {
    setIsClosing(true); // Начинаем анимацию закрытия
    setTimeout(() => {
      setDeleteConfirmation({ show: false, id: null }); // Скрываем окно после завершения анимации
      setIsClosing(false); // Сбрасываем состояние анимации
    }, 300); // Время задержки должно совпадать с длительностью анимации
  };

  // Функция для генерации пустых строк
  const generateEmptyRows = (currentRows) => {
    const emptyRows = [];
    for (let i = currentRows.length; i < ROWS_PER_PAGE; i++) {
      emptyRows.push({ id: `empty-${i}`, isEmpty: true });
    }
    return emptyRows;
  };

  const handleBankChange = (e) => {
    const selectedBankName = e.target.value;
    setSelectedBank(selectedBankName);
  };

  const loadPaymentOptions = useCallback(async () => {
    setIsLoading(true); // Устанавливаем состояние загрузки в true

    try {
      // Очищаем кэш перед загрузкой новых данных
      localStorage.removeItem("paymentOptions");

      // Делаем запрос на сервер
      const response = await axios.get("/api/payment-options", {
        withCredentials: true,
      });

      console.log("Ответ от сервера:", response.data); // Логируем ответ от сервера

      // Устанавливаем полученные данные в состояние
      setPaymentOptions(response.data);

      // Кэшируем новые данные
      localStorage.setItem("paymentOptions", JSON.stringify(response.data));
    } catch (error) {
      console.error("Ошибка при загрузке реквизитов:", error);
    } finally {
      setIsLoading(false); // Устанавливаем состояние загрузки в false
    }
  }, []);

  useEffect(() => {
    loadPaymentOptions();
  }, [loadPaymentOptions, user.walletStatus]);

  const handleAddPaymentOption = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const newOption = {
        name: formData.get("name")?.trim() || "",
        bank: selectedBank,
        limit: Number(formData.get("limit")) || 0,
        timeout: Number(formData.get("timeout")) || 0,
        maxRequests: Number(formData.get("max_requests")) || 0,
        botRequisites: formData.get("bot_requisites")?.trim() || "",
        comment: formData.get("comment")?.trim() || "",
        isActive: true,
    };

    // Подробная валидация
    const validationErrors = validatePaymentOption(newOption);
    if (validationErrors && validationErrors.length > 0) {
        validationErrors.forEach((error) => toast.error(error));
        return;
    }

    try {
        if (editPaymentOption) {
            // Если мы редактируем существующую опцию, обновляем ее
            await updatePaymentOption(
                { ...newOption, _id: editPaymentOption._id },
                form
            );
        } else {
            // Если мы добавляем новую опцию, проверяем на существование
            const existingOption = paymentOptions.find(
                (option) =>
                    option.botRequisites === newOption.botRequisites &&
                    option.bank === newOption.bank
            );
            if (existingOption) {
                toast.error(
                    "Такая платежная опция уже существует. Пожалуйста, измените реквизиты."
                );
                return;
            }

            console.log("Отправляемые данные:", newOption);
            const response = await axios.post("/api/payment-options", newOption, {
                withCredentials: true,
            });

            if (response.data) {
                await loadPaymentOptions();
                setShowAddForm(false);
                form.reset();
                setSelectedBank(""); // Сбрасываем выбранный банк

                // Очистка кэша после добавления новой опции
                localStorage.removeItem("paymentOption");

                toast.success("Реквизит успешно добавлен");
            }
        }
    } catch (error) {
        console.error("Ошибка при добавлении реквизита:", error);
        const errorMessage =
            error.response?.data?.error ||
            error.response?.data?.details ||
            "Не удалось добавить реквизит. Пожалуйста, попробуйте снова.";
        toast.error(errorMessage);
    }
};

  const validatePaymentOption = (option) => {
    if (!option.name) return "Пожалуйста, введите название";
    if (!option.bank) return "Пожалуйста, выберите банк";
    if (isNaN(option.limit) || option.limit <= 0)
      return "Пожалуйста, введите корректный лимит";
    if (isNaN(option.timeout) || option.timeout < 0)
      return "Пожалуйста, введите корректный таймаут";
    if (isNaN(option.maxRequests) || option.maxRequests <= 0)
      return "Пожалуйста, введите корректное максимальное количество заявок";
    if (!option.botRequisites) return "Пожалуйста, введите реквизит для бота";
    return null;
  };

  const updatePaymentOption = async (option, form) => {
    const response = await axios.put(
      `/api/payment-options/${editPaymentOption._id}`,
      option,
      {
        withCredentials: true,
      }
    );

    if (response.data) {
      await handleSuccessfulResponse("Реквизит успешно обновлен", form);
    }
  };

  const addPaymentOption = async (option, form) => {
    const response = await axios.post("/api/payment-options", option, {
      withCredentials: true,
    });

    if (response.data) {
      await handleSuccessfulResponse("Реквизит успешно добавлен", form);
    }
  };

  const handleSuccessfulResponse = async (successMessage, form) => {
    await loadPaymentOptions();
    setShowAddForm(false);
    form.reset(); // Сбрасываем форму
    setSelectedBank(""); // Сбрасываем выбранный банк
    setEditPaymentOption(null); // Сбрасываем состояние редактирования
    toast.success(successMessage);
  };

  const handleDeleteOption = (id) => {
    setDeleteConfirmation({ show: true, id });
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/payment-options/${deleteConfirmation.id}`, {
        withCredentials: true,
      });
      await loadPaymentOptions();
      toast.success("Реквизит успешно удален");
      setDeleteConfirmation({ show: false, id: null });
    } catch (error) {
      console.error("Ошибка при удалении реквизита:", error);
      toast.error("Не удалось удалить реквизит. Пожалуйста, попробуйте снова.");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await axios.put(
        `/api/payment-options/${id}/toggle`,
        null,
        {
          withCredentials: true,
        }
      );

      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }

      if (response.data.isActive !== undefined) {
        setPaymentOptions((prevOptions) =>
          prevOptions.map((option) =>
            option._id === id
              ? { ...option, isActive: response.data.isActive }
              : option
          )
        );

        toast.success(
          response.data.isActive
            ? "Реквизит успешно активирован"
            : "Реквизит успешно деактивирован"
        );
      } else {
        await loadPaymentOptions();
        toast.success("Статус реквизита обновлен");
      }
    } catch (error) {
      console.error("Ошибка при изменении статуса реквизита:", error);
      if (error.response && error.response.status === 400) {
        // Если сервер вернул ошибку 400, это может означать,
        // что кошелек выключен
        toast.error(
          "Не удалось изменить статус реквизита. Пожалуйста, переключите статус кошелька."
        );
      } else {
        toast.error(
          "Не удалось изменить статус реквизита. Пожалуйста, попробуйте снова."
        );
      }
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Вычисляем общее количество страниц
  const totalPages = Math.max(
    1,
    Math.ceil(paymentOptions.length / ROWS_PER_PAGE)
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return ""; // Если дата некорректная, возвращаем пустую строку
    }
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    return `${day}.${month} ${hours}:${minutes}`;
  };

  if (error)
    return (
      <div className="payment-page">
        <div className="payment-container">
          <img src={mmr_logo} className="auth_logo" />
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button onClick={() => navigate("/")} className="back-button">
              Вернуться на главную
            </button>
            <Link to="https://mmr-info.ru">
              Связаться с тех. поддержкой сайта
            </Link>
          </div>
        </div>
      </div>
    );

  return (
    <>
      <div className="page-container">
        <Header />
        <main>
          <div className="main_container">
            <div className="applications">
              <div className="pay">
                <div className="payment_title_add">
                  <h2 className="payment_title">Реквизиты</h2>
                  <button className="add" onClick={() => setShowAddForm(true)}>
                    Добавить реквизит
                  </button>
                </div>

                <>
                  {isLoading ? (
                    <div className="table_preloader">
                      <section>
                        <span className="loader-26"></span>
                      </section>
                    </div>
                  ) : (
                    <div className="applications_table">
                      <table>
                        <thead>
                          <tr>
                            <th>Название</th>
                            <th>Банк</th>
                            <th>Оборот (сегодня)</th>
                            <th>Лимиты (₽)</th>
                            <th>ВКЛ / ВЫКЛ</th>
                            <th>Действия</th>
                            <th>Дата</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ...paymentOptions.slice(
                              (currentPage - 1) * ROWS_PER_PAGE,
                              currentPage * ROWS_PER_PAGE
                            ),
                            ...generateEmptyRows(
                              paymentOptions.slice(
                                (currentPage - 1) * ROWS_PER_PAGE,
                                currentPage * ROWS_PER_PAGE
                              )
                            ),
                          ].map((option) => (
                            <tr
                              key={
                                option.isEmpty
                                  ? `empty-${Math.random()}`
                                  : option._id
                              }
                              className={option.isEmpty ? "empty-row" : ""}
                            >
                              <td>{option.isEmpty ? "" : option.name}</td>
                              <td>
                                {option.isEmpty ? (
                                  ""
                                ) : (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                      pointerEvents: "none",
                                    }}
                                  >
                                    <BankLogo bankName={option.bank} />
                                    {option.botRequisites}
                                  </div>
                                )}
                              </td>
                              <td>
                                {option.isEmpty
                                  ? ""
                                  : `${(option.usedAmount || 0).toFixed(
                                      2
                                    )} / ${option.limit.toFixed(2)}`}
                              </td>
                              <td>
                                {option.isEmpty
                                  ? ""
                                  : (
                                      option.limit - (option.usedAmount || 0)
                                    ).toFixed(2)}
                              </td>
                              <td className="active-inactive">
                                {option.isEmpty ? (
                                  ""
                                ) : (
                                  <button
                                    className={`status_button ${
                                      option.isActive ? "active" : "inactive"
                                    }`}
                                    onClick={() =>
                                      handleToggleStatus(option._id)
                                    }
                                  >
                                    {option.isActive ? "Активен" : "Неактивен"}
                                  </button>
                                )}
                              </td>
                              <td className="delete_payment_option">
                                {option.isEmpty ? (
                                  ""
                                ) : (
                                  <>
                                    <button
                                      className="checking_button cancel"
                                      onClick={() =>
                                        handleDeleteOption(option._id)
                                      }
                                    >
                                      ❌
                                    </button>
                                    <button
                                      className="checking_button edit"
                                      onClick={() =>
                                        handleEditPaymentOption(option)
                                      }
                                    >
                                      ✏️
                                    </button>
                                  </>
                                )}
                              </td>
                              <td>{formatDate(option.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>

                <div className="pagination">
                  <p>
                    {currentPage} / {totalPages}
                  </p>
                  <div className="page_arrow">
                    <button
                      className="pagination_button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      ←
                    </button>
                    <button
                      className="pagination_button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Модальное окно добавления реквизита */}
      {showAddForm && (
        <div
          className={`modal-overlay ${isClosing ? "closing" : ""}`}
          onClick={handleCloseAddForm}
        >
          <div
            className={`payment_option_input ${isClosing ? "closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleAddPaymentOption} className="payment_form">
              <h2 className="payment_option_title">
                {editPaymentOption
                  ? "Редактирование реквизита:"
                  : "Добавление реквизита:"}
              </h2>

              <label htmlFor="name">Название</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                minLength="1"
                defaultValue={editPaymentOption ? editPaymentOption.name : ""}
              />

              <label htmlFor="bank">Банк</label>
              <CustomSelect
                options={banks}
                value={
                  selectedBank ||
                  (editPaymentOption ? editPaymentOption.bank : "")
                }
                onChange={(value) => setSelectedBank(value)}
              />

              <label htmlFor="bot_requisites">Реквизиты</label>
              <input
                type="text"
                id="bot_requisites"
                name="bot_requisites"
                required
                minLength="1"
                defaultValue={
                  editPaymentOption ? editPaymentOption.botRequisites : ""
                }
              />

              <label htmlFor="limit">Лимиты в ₽</label>
              <input
                type="number"
                id="limit"
                name="limit"
                required
                min="0"
                step="0.01"
                defaultValue={editPaymentOption ? editPaymentOption.limit : ""}
              />

              <label htmlFor="timeout">
                Таймаут между сделками (в секундах)
              </label>
              <input
                type="number"
                id="timeout"
                name="timeout"
                required
                min="0"
                defaultValue={
                  editPaymentOption ? editPaymentOption.timeout : ""
                }
              />

              <label htmlFor="max_requests">Максимальное кол-во заявок</label>
              <input
                type="number"
                id="max_requests"
                name="max_requests"
                required
                min="1"
                defaultValue={
                  editPaymentOption ? editPaymentOption.maxRequests : ""
                }
              />

              <label htmlFor="comment">Примечание</label>
              <input
                type="text"
                id="comment"
                name="comment"
                defaultValue={
                  editPaymentOption ? editPaymentOption.comment : ""
                }
              />

              <div className="form_buttons">
                <button
                  type="button"
                  className="cancel_btn"
                  onClick={handleCloseAddForm}
                >
                  Отменить
                </button>
                <button type="submit" className="confirm_btn">
                  {editPaymentOption ? "Сохранить изменения" : "Добавить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {deleteConfirmation.show && (
        <div
          className={`modal-overlay ${isClosing ? "closing" : ""}`}
          onClick={handleCloseDeleteConfirmation}
        >
          <div
            className={`confirmation-modal ${isClosing ? "closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <img src={mmr_logo} className="auth_logo" />
            <h3>Подтверждение удаления ❌</h3>
            <p>Проверьте, пожалуйста, реквизит, который хотите удалить.</p>
            <div className="confirmation-buttons">
              <button
                className="cancel_btn"
                onClick={handleCloseDeleteConfirmation} // Обработчик закрытия}
              >
                Отменить
              </button>
              <button className="confirm_btn" onClick={confirmDelete}>
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UserPayments;
