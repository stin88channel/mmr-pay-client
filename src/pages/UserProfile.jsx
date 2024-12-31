import { useContext, useState, useEffect } from "react";
import { UserContext } from "../../context/UserContext";
import Header from "./Header";
import "./css/UserProfile.css";
import axios from "axios";
import { toast } from "react-hot-toast";

import { FaGoogle } from "react-icons/fa";

export default function UserProfile() {
  const { user, setUser, loading } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isDisable2FAModalOpen, setIsDisable2FAModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState(Array(6).fill(""));
  const [error, setError] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [twoFASecret, setTwoFASecret] = useState("");
  const [isTokenFilled, setIsTokenFilled] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState(false);
  const [twoFAError, setTwoFAError] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get("/api/user/settings", {
          withCredentials: true,
        });
        setUser(response.data); // Устанавливаем данные пользователя
      } catch (error) {
        console.error("Ошибка при загрузке данных пользователя:", error);
        setError("Ошибка при загрузке данных пользователя");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [setUser]);

  const handleClosePasswordModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsPasswordModalOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const handleOpenPasswordModal = () => {
    setIsClosing(false); // Сбрасываем состояние закрытия
    setIs2FAModalOpen(false); // Закрываем 2FA модальное окно, если оно открыто
    setIsPasswordModalOpen(true); // Открываем модальное окно изменения пароля
  };

  const handleOpen2FAModal = async () => {
    try {
      const response = await axios.get("/api/generate-2fa", {
        withCredentials: true,
      });
      setQrCodeUrl(response.data.qrCodeUrl);
      setTwoFASecret(response.data.secret); // Сохраняем секрет в состоянии
      setIsClosing(false); // Сбрасываем состояние закрытия
      setIsPasswordModalOpen(false); // Закрываем модальное окно изменения пароля, если оно открыто
      setIs2FAModalOpen(true); // Открываем модальное окно 2FA
    } catch (error) {
      console.error("Ошибка при открытии 2FA модала:", error);
      toast.error("Не удалось сгенерировать QR-код для 2FA");
    }
  };

  const handleClose2FAModal = () => {
    setIsClosing(true); // Начинаем анимацию закрытия
    setTimeout(() => {
      setIs2FAModalOpen(false); // Скрываем окно после завершения анимации
      setToken(Array(6).fill("")); // Сбросить токен при закрытии модала
      setIsTokenFilled(false); // Сбрасываем состояние заполненности токена
    }, 300); // Время задержки должно совпадать с длительностью анимации
  };

  const handleOpenDisable2FAModal = () => {
    setIsClosing(false);
    setIsDisable2FAModalOpen(true);
  };

  const handleCloseDisable2FAModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsDisable2FAModalOpen(false);
      setToken(Array(6).fill("")); // Сбросить токен при закрытии модала
    }, 300);
  };

  const handleSubmitToken = async (e) => {
    e.preventDefault();
    const tokenString = token.join(""); // Преобразуем массив в строку

    try {
      // Проверка кода 2FA
      const response = await axios.post(
        "/api/enable-2fa",
        { token: tokenString, secret: twoFASecret }, // Отправляем токен и секрет
        { withCredentials: true }
      );

      toast.success(response.data.message); // Сообщение об успешной активации 2FA
      setIs2FAModalOpen(false); // Закрываем модальное окно

      // Перезагрузка страницы для обновления состояния
      window.location.reload();
    } catch (error) {
      console.error("Ошибка при активации 2FA:", error);
      toast.error(error.response?.data?.error || "Ошибка при активации 2FA");
    }
  };

  const handleDisable2FA = async () => {
    const fullToken = token.join(""); // Объединяем токен в строку
    console.log("Токен перед отправкой:", fullToken); // Отладочный вывод

    try {
      const response = await axios.post(
        "/api/disable-2fa",
        { token: fullToken }, // Передаем токен в теле запроса
        { withCredentials: true }
      );
      toast.success(response.data.message); // Сообщение об успешном отключении 2FA

      // Обновляем данные пользователя из базы данных
      const userResponse = await axios.get("/api/user/settings", {
        withCredentials: true,
      });
      setUser(userResponse.data); // Устанавливаем актуальные данные пользователя

      handleCloseDisable2FAModal(); // Закрываем модальное окно
    } catch (error) {
      console.error("Ошибка при отключении 2FA:", error.response?.data);
      toast.error(error.response?.data?.error || "Ошибка при отключении 2FA");
    }
  };

  if (loading)
    return (
      <div className="preload">
        <span className="loader"></span>
      </div>
    );
  if (!user) return <div>Не авторизован</div>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCurrentPasswordError(false); // Сбрасываем состояние ошибки текущего пароля перед проверкой

    // Проверка на заполненность всех полей
    if (
      !currentPassword.trim() ||
      !newPassword.trim() ||
      !confirmPassword.trim()
    ) {
      setError("Пожалуйста, заполните все поля");
      return;
    }

    // Проверка на минимальную длину нового пароля
    if (newPassword.length < 6) {
      setError("Новый пароль должен содержать минимум 6 символов");
      return;
    }

    // Проверка на совпадение нового пароля и его подтверждения
    if (newPassword !== confirmPassword) {
      setError("Новый пароль и подтверждение не совпадают");
      toast.error("Новый пароль и подтверждение не совпадают");
      return;
    }

    // Проверка на наличие хотя бы одной цифры и одной буквы
    const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d)/; // Регулярное выражение для проверки
    if (!passwordPattern.test(newPassword)) {
      setError("Пароль должен содержать хотя бы одну букву и одну цифру");
      return;
    }

    // Проверка на наличие 2FA
    let tokenString = "";
    if (user.twoFAEnabled) {
      tokenString = token.join(""); // Преобразуем массив в строку
      if (!tokenString.trim()) {
        setError("Пожалуйста, введите код 2FA");
        return;
      }
    }

    try {
      const response = await axios.put(
        "/api/user/change-password",
        {
          currentPassword,
          newPassword,
          token: user.twoFAEnabled ? tokenString : undefined, // Передаем токен, если 2FA включен
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        handleClosePasswordModal(); // Закрываем модальное окно
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setError(null);
        toast.success("Пароль успешно изменен!");
      }
    } catch (error) {
      console.error("Ошибка при изменении пароля:", error);
      const errorMessage =
        error.response?.data?.error || "Не удалось изменить пароль";
      setError(errorMessage);

      // Если ошибка связана с неверным текущим паролем
      if (errorMessage.includes("Неверный текущий пароль")) {
        setCurrentPasswordError(true);
        toast.error("Неверный текущий пароль");
      }

      // Если ошибка связана с неверным кодом 2FA
      if (errorMessage.includes("Неверный код 2FA")) {
        setTwoFAError(true); // Устанавливаем состояние ошибки 2FA
        toast.error("Неверный код 2FA");
      }
    }
  };

  const handleTokenChange = (index, value) => {
    const newToken = [...token];

    // Проверяем, является ли введенный символ цифрой или пустым
    if (/^\d$/.test(value) || value === "") {
      newToken[index] = value;
      setToken(newToken);
      setIsTokenFilled(newToken.every((t) => t !== "")); // Проверка заполненности токена

      // Перейти к следующему полю, если текущее поле заполнено
      if (value && index < token.length - 1) {
        document.getElementById(`token-${index + 1}`).focus();
      }
    } else {
      // Если введенный символ не является цифрой, можно добавить уведомление или игнорировать
      toast.error("Пожалуйста, введите только цифры."); // Пример уведомления
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!token[index] && index > 0) {
        // Если текущее поле пустое и мы нажимаем Backspace, переходим к предыдущему полю
        const newToken = [...token];
        newToken[index - 1] = ""; // Сбросить предыдущее поле
        setToken(newToken);
        document.getElementById(`token-${index - 1}`).focus(); // Фокус на предыдущее поле
      }
    } else if (e.key === "ArrowLeft") {
      if (index > 0) {
        // Перейти к предыдущему полю
        const prevInput = document.getElementById(`token-${index - 1}`);
        prevInput.focus();
        prevInput.setSelectionRange(
          prevInput.value.length,
          prevInput.value.length
        ); // Установить курсор в конец
      }
    } else if (e.key === "ArrowRight") {
      if (index < token.length - 1) {
        // Перейти к следующему полю
        const nextInput = document.getElementById(`token-${index + 1}`);
        nextInput.focus();
        nextInput.setSelectionRange(
          nextInput.value.length,
          nextInput.value.length
        ); // Установить курсор в конец
      }
    } else if (e.key.length === 1 && token[index].length === 1) {
      // Если в поле уже есть символ, и мы пытаемся ввести новый, переходим к следующему полю
      if (index < token.length - 1) {
        const nextInput = document.getElementById(`token-${index + 1}`);
        nextInput.focus();
        nextInput.setSelectionRange(0, 0); // Установить курсор в начало
      }
    }
  };

  const isFormValid = () => {
    const isPasswordFieldsFilled =
      currentPassword.trim() !== "" &&
      newPassword.trim() !== "" &&
      confirmPassword.trim() !== "";
    const is2FARequired = user.twoFAEnabled && isTokenFilled; // Проверка на заполненность токена, если 2FA включена
    return isPasswordFieldsFilled && (!user.twoFAEnabled || is2FARequired);
  };

  return (
    <>
      <Header />
      <main>
        <div className="main_container">
          <div className="applications">
            <h2>Настройки пользователя</h2>
            <div className="profile_buttons">
            <button onClick={handleOpenPasswordModal} className="profile_button change_password">Изменить пароль</button>
            {user.twoFAEnabled ? (
              <button onClick={handleOpenDisable2FAModal} className="profile_button twofa_off_button">Отключить 2FA</button>
            ) : (
              <button onClick={handleOpen2FAModal} className="profile_button add_twofa_button">Добавить 2FA</button>
            )}
            </div>
          </div>
        </div>
      </main>

      {/* Модальное окно для изменения пароля */}
      {isPasswordModalOpen && (
        <div className="modal-overlay" onClick={handleClosePasswordModal}>
          <div
            className={`modal-content ${isClosing ? "closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Изменить пароль</h3>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
              <label htmlFor="currentPassword">Текущий пароль:</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{
                  borderColor: currentPasswordError ? "red" : "",
                }}
              />
              <label htmlFor="newPassword">Новый пароль:</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{
                  borderColor:
                    error &&
                    error.includes(
                      "Новый пароль должен содержать минимум 6 символов"
                    )
                      ? "red"
                      : "",
                }}
              />
              <label htmlFor="confirmPassword">Подтверждение пароля:</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  borderColor:
                    error &&
                    error.includes(
                      "Новый пароль должен содержать минимум 6 символов"
                    )
                      ? "red"
                      : "",
                }}
              />
              {user.twoFAEnabled && (
                <div>
                  <label htmlFor="token">Введите код 2FA:</label>
                  <div className="token-inputs">
                    <FaGoogle className="google-icon" />
                    {token.map((value, index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength="1"
                        value={value}
                        onChange={(e) => {
                          const newValue = e.target.value;

                          // Проверяем, является ли введенный символ цифрой или пустым
                          if (/^\d$/.test(newValue) || newValue === "") {
                            handleTokenChange(index, newValue);
                          }
                        }}
                        onKeyDown={(e) => handleKeyDown(index, e)} // Используем вашу функцию handleKeyDown
                        id={`token-${index}`}
                        style={{
                          borderColor: twoFAError ? "red" : "", // Применяем красную обводку, если есть ошибка 2FA
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="modal-buttons">
                <button
                  type="submit"
                  className="confirm_btn"
                  disabled={!isFormValid()} // Делаем кнопку неактивной, если поля не заполнены
                  style={{
                    backgroundColor: isFormValid() ? "#26bbff" : "#3a393e", // Цвет кнопки
                    cursor: isFormValid() ? "pointer" : "not-allowed", // Курсор
                  }}
                >
                  Сохранить изменения
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {is2FAModalOpen && (
        <div className="modal-overlay" onClick={handleClose2FAModal}>
          <div
            className={`modal-content ${isClosing ? "closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Добавить 2FA</h3>
            <img src={qrCodeUrl} alt="QR Code" className="twofa_qr" />
            <form onSubmit={handleSubmitToken}>
              <label htmlFor="token">Введите код 2FA:</label>
              <div className="token-inputs">
                <FaGoogle className="google-icon" />
                {token.map((value, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    value={value}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      // Проверяем, является ли введенный символ цифрой
                      if (/^\d$/.test(newValue) || newValue === "") {
                        handleTokenChange(index, newValue);
                      }
                    }}
                    onKeyDown={(e) => handleKeyDown(index, e)} // Обработчик нажатия клавиш
                    onFocus={() => {
                      // Устанавливаем курсор в конец при фокусе
                      const input = document.getElementById(`token-${index}`);
                      input.setSelectionRange(
                        input.value.length,
                        input.value.length
                      );
                    }}
                    onPaste={(e) => {
                      e.preventDefault(); // Предотвращаем стандартное поведение вставки
                      const pastedData = e.clipboardData.getData("text"); // Получаем вставляемые данные
                      const digits = pastedData
                        .split("")
                        .filter((char) => /^\d$/.test(char)); // Оставляем только цифры

                      // Создаем новый массив для обновления состояния
                      const newToken = [...token];

                      // Заполняем поля, начиная с текущего индекса
                      for (let i = 0; i < digits.length; i++) {
                        if (index + i < newToken.length) {
                          newToken[index + i] = digits[i]; // Заполняем соответствующее поле
                        }
                      }

                      setToken(newToken); // Обновляем состояние
                    }}
                    id={`token-${index}`}
                  />
                ))}
              </div>
              <div className="modal-buttons">
                <button
                  type="submit"
                  className="confirm_btn"
                  disabled={!isTokenFilled} // Делаем кнопку неактивной, если не все инпуты заполнены
                  style={{
                    backgroundColor: isTokenFilled ? "#26bbff" : "#3a393e", // Цвет кнопки
                    cursor: isTokenFilled ? "pointer" : "not-allowed", // Курсор
                  }}
                >
                  Подтвердить код
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно для отключения 2FA */}
      {isDisable2FAModalOpen && (
        <div className="modal-overlay" onClick={handleCloseDisable2FAModal}>
          <div
            className={`modal-content ${isClosing ? "closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Отключить 2FA</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault(); // Предотвращаем стандартное поведение формы
                handleDisable2FA(); // Вызываем функцию отключения 2FA
              }}
            >
              <label htmlFor="token" className="twofa_off_label">
                Введите 6-значный код, указанный в приложении-аутентификаторе.
              </label>
              <div className="token-inputs">
                <FaGoogle className="google-icon" />
                {token.map((value, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    value={value}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      // Проверяем, является ли введенный символ цифрой
                      if (/^\d$/.test(newValue) || newValue === "") {
                        handleTokenChange(index, newValue);
                      }
                    }}
                    onKeyDown={(e) => {
                      // Проверяем, была ли нажата клавиша Delete
                      if (e.key === "Delete") {
                        e.preventDefault(); // Предотвращаем стандартное поведение
                        if (index + 1 < token.length) {
                          handleTokenChange(index + 1, ""); // Удаляем значение следующего инпута
                        }
                      }
                      handleKeyDown(index, e); // Обработчик нажатия клавиш
                    }}
                    onFocus={() => {
                      // Устанавливаем курсор в конец при фокусе
                      const input = document.getElementById(`token-${index}`);
                      input.setSelectionRange(
                        input.value.length,
                        input.value.length
                      );
                    }}
                    onPaste={(e) => {
                      e.preventDefault(); // Предотвращаем стандартное поведение вставки
                      const pastedData = e.clipboardData.getData("text"); // Получаем вставляемые данные
                      const digits = pastedData
                        .split("")
                        .filter((char) => /^\d$/.test(char)); // Оставляем только цифры

                      // Создаем новый массив для обновления состояния
                      const newToken = [...token];

                      // Заполняем поля, начиная с текущего индекса
                      for (let i = 0; i < digits.length; i++) {
                        if (index + i < newToken.length) {
                          newToken[index + i] = digits[i]; // Заполняем соответствующее поле
                        }
                      }

                      setToken(newToken); // Обновляем состояние
                    }}
                    id={`token-${index}`}
                  />
                ))}
              </div>
              <div className="modal-buttons">
                <button
                  type="submit"
                  className="confirm_btn"
                  disabled={!isTokenFilled} // Делаем кнопку неактивной, если не все инпуты заполнены
                  style={{
                    backgroundColor: isTokenFilled ? "#26bbff" : "#3a393e", // Цвет кнопки
                    cursor: isTokenFilled ? "pointer" : "not-allowed", // Курсор
                  }}
                >
                  Подтвердить код
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
