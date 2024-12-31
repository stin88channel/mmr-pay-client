import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import mmr_logo from "../assets/mmr_logo.png";

export default function Register() {
  const navigate = useNavigate();

  const [data, setData] = useState({
    login: "",
    email: "",
    password: "",
  });

  const isFormValid = () => {
    return data.login.trim() !== "" && 
           data.email.trim() !== "" && 
           data.password.trim() !== "" && 
           data.password.length >= 6; // Проверка на минимальную длину пароля
  };

  const registerUser  = async (e) => {
    e.preventDefault();
    const { login, email, password } = data;

    try {
      const response = await axios.post(
        "http://http://mmrtest.ru:8000/account/signup",
        {
          login,
          email,
          password,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }

      // Вместо сброса на пустой объект, возвращаем к начальным значениям
      setData({
        login: "",
        email: "",
        password: "",
      });
      toast.success("Регистрация успешна!");
      navigate("/account/signin");
    } catch (error) {
      console.error("Ошибка при регистрации:", error);
      const errorMessage =
        error.response?.data?.error || "Произошла ошибка при регистрации";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={registerUser } className="login_form">
        <img src={mmr_logo} className="auth_logo" />
        <h2 className="auth_title">Регистрация</h2>

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
              />
            </div>

            <div className="login">
              <label htmlFor="email" className="auth_label">
                Почта
              </label>
              <input
                className="auth_input"
                type="email"  
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
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
              />
            </div>
          </div>
          <button 
            type="submit" 
            className="auth_button" 
            disabled={!isFormValid()} // Делаем кнопку неактивной, если форма не валидна
            style={{
              backgroundColor: isFormValid() ? "rgb(38, 187, 255)" : "#3a393e", // Цвет кнопки
              cursor: isFormValid() ? "pointer" : "not-allowed", // Курсор
            }}
          >
            Зарегистрироваться
          </button>
        </div>

        <Link to="/account/signin" className="link_to_signin">Зарегистрированы? Вход в аккаунт</Link>
      </form>
    </div>
  );
}