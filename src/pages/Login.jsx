import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import "./css/Login.css";
import { UserContext } from "../../context/UserContext";

import mmr_logo from "../assets/mmr_logo.png";

import { FaGoogle } from "react-icons/fa";

export default function Login() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState({
    login: "",
    password: "",
  });
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false); // Для анимации закрытия
  const [token, setToken] = useState(Array(6).fill("")); // Для 2FA
  const [isTokenFilled, setIsTokenFilled] = useState(false);
  const [tempToken, setTempToken] = useState(""); // Временный токен для хранения

  // Очистка формы при монтировании компонента
  useEffect(() => {
    setData({ login: "", password: "" });
  }, []);

  const validateForm = () => {
    if (!data.login.trim() || !data.password.trim()) {
      toast.error("Пожалуйста, заполните все поля");
      return false;
    }

    if (data.password.length < 6) {
      toast.error("Пароль должен содержать минимум 6 символов");
      return false;
    }

    return true;
  };

  const loginUser = async (e) => {
    e.preventDefault();

    // Проверка формы перед продолжением
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://mmrtest.ru:8000/account/signin",
        {
          login: data.login.trim(),
          password: data.password,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      // Извлекаем данные пользователя из ответа
      const { user, token } = response.data;

      // Проверка наличия необходимых данных
      if (!user || !user._id || !user.login) {
        throw new Error("Неполные данные пользователя в ответе сервера");
      }

      // Проверка состояния 2FA
      if (user.twoFAEnabled) {  
        handleSuccessfulLogin(user, token); // Продолжаем авторизацию
        setIs2FAModalOpen(true); // Открываем модальное окно для ввода 2FA
      } else {
        handleSuccessfulLogin(user, token); // Продолжаем авторизацию
      }
    } catch (error) {
      // Обработка ошибок
      const errorMessage =
        error.response?.data?.error || "Произошла ошибка при входе";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false); // Сбрасываем состояние загрузки
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    const tokenString = token.join(""); // Преобразуем массив в строку

    // Логирование перед отправкой
    console.log("Отправляемый код 2FA:", tokenString);

    // Проверка длины токена и его формата
    if (tokenString.length !== 6 || !/^\d{6}$/.test(tokenString)) {
        toast.error("Код 2FA должен содержать 6 цифр");
        return;
    }

    // Проверка состояния пользователя
    if (!user || !user._id) {
        toast.error("Пользователь не аутентифицирован. Пожалуйста, войдите в систему.");
        return;
    }

    try {
        // Отправка запроса на проверку кода 2FA
        const response = await axios.post(
            "http://mmrtest.ru:8000/account/verify-2fa",
            { token: tokenString, userId: user._id }, // Передаем токен и ID пользователя
            {
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        );

        // Логирование ответа от сервера
        console.log("Ответ от сервера при проверке 2FA:", response.data);

        // Проверка успешного ответа
        if (response.data?.message === "Код 2FA подтвержден") {
            handleSuccessfulLogin(response.data.user, tempToken);
            setIs2FAModalOpen(false);
            toast.success("Код 2FA подтвержден. Вы успешно вошли в систему!");
        } else {
            toast.error("Не удалось подтвердить код 2FA. Попробуйте еще раз.");
        }
    } catch (error) {
        // Обработка ошибок
        console.error("Ошибка при подтверждении кода 2FA:", error);

        // Проверка наличия ответа от сервера
        if (error.response) {
            const errorMessage = error.response.data?.error || "Неизвестная ошибка при подтверждении кода 2FA";
            toast.error(errorMessage);
        } else {
            toast.error("Ошибка сети или сервер недоступен. Попробуйте позже.");
        }
    }
};

  const handleSuccessfulLogin = (userData, token) => {
    document.cookie = `token=${token}; path=/; max-age=604800; Secure; SameSite=Strict`;
    setUser({
      _id: userData._id,
      login: userData.login,
      auth: userData.auth,
      walletStatus: userData.walletStatus,
      role: userData.role,
      balance: userData.balance || 0,
      twoFAEnabled: userData.twoFAEnabled,
    });
    toast.success("Успешный вход в систему");
    navigate("/user/settings");
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

  const handleTokenChange = (index, value) => {
    const newToken = [...token];
    newToken[index] = value;
    setToken(newToken);
    setIsTokenFilled(newToken.every((t) => t !== "")); // Проверка заполненности токена

    // Перейти к следующему полю, если текущее поле заполнено
    if (value && index < token.length - 1) {
      document.getElementById(`token-${index + 1}`).focus();
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={loginUser} className="login_form">
        <img src={mmr_logo} className="auth_logo" />
        <h2 className="auth_title">Войти</h2>

        <div className="auth">
          <div className="placeholder">
            <div className="login">
              <label htmlFor="login" className="auth_label">
                Логин
              </label>
              <input
                className="auth_input"
                type="text"
                value={data.login}
                onChange={(e) => setData({ ...data, login: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="password">
              <label htmlFor="password" className="auth_label">
                Пароль
              </label>
              <input
                className="auth_input"
                type="password"
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>
          <button type="submit" className="auth_button" disabled={isLoading}>
            {isLoading ? (
              <div className="login_loader"></div> // Прелоадер
            ) : (
              "Войти"
            )}
          </button>
        </div>
      </form>

      {/* Модальное окно для 2FA */}
      {is2FAModalOpen && (
        <div
          className={`twofa-modal-overlay ${isClosing ? "" : "show"}`}
          onClick={() => {
            setIsClosing(true);
            setTimeout(() => {
              setIs2FAModalOpen(false);
              setIsClosing(false);
            }, 300);
          }}
        >
          <div
            className={`twofa-modal-content ${isClosing ? "closing" : "show"}`}
            onClick={(e) => e.stopPropagation()} // Предотвращаем закрытие при клике внутри модального окна
          >
            <form onSubmit={handle2FASubmit}>
              <h2>Введите код безопасности</h2>
              <p className="auth_2fa_text">
                Введите 6-значный код, указанный в приложении-аутентификаторе.
              </p>
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
                        handleTokenChange(index, ""); // Удаляем значение текущего инпута
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
              <div className="auth_2fa_buttons">
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
                <Link
                  className="go_back_link"
                  onClick={() => {
                    setIsClosing(true);
                    setTimeout(() => {
                      setIs2FAModalOpen(false);
                      setIsClosing(false);
                    }, 300);
                  }}
                >
                  К экрану выхода
                </Link>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
