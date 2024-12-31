import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios'; // Добавьте эту строку
import "../components/css/Wrapper.css";
import { UserContext } from "../../context/UserContext";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from 'uuid';

const Wrapper = () => {
  
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const handleWithdrawClick = (e) => {
    e.preventDefault();
    setIsWithdrawOpen(true);
  };

  const handleCloseWithdraw = () => {
    setIsWithdrawOpen(false);
    setWithdrawAmount("");
  };

  const handleWithdrawSubmit = async () => {
    if (
        !withdrawAmount ||
        isNaN(withdrawAmount) ||
        parseFloat(withdrawAmount) <= 0
    ) {
        toast.error("Пожалуйста, введите корректную сумму");
        return;
    }

    try {
        // Генерация кастомного URL с использованием UUID
        const customUrl = `http://https://mmrtest.ru:5173/payment/${uuidv4()}`; // Используйте uuid для уникальности

        const response = await axios.post(
            "/api/create-payment-option",
            {
                amount: parseFloat(withdrawAmount),
                customUrl: customUrl // Добавляем кастомный URL в запрос
            },
            {
                withCredentials: true,
            }
        );

        console.log("Созданная платежная опция:", response.data);

        if (response.data && response.data.customUrl) {
            navigate(`/payment/${response.data.customUrl}`); // Перенаправляем на кастомный URL
            handleCloseWithdraw();
            toast.success("Платёжная операция создана");
        }
    } catch (error) {
        console.error("Ошибка при создании платежной опции:", error);
        const errorMessage =
            error.response?.data?.error ||
            "Не удалось создать платежную опцию. Попробуйте позже.";
        toast.error(errorMessage);
    }
};

  return (
    <>
      <div className="wrapper">
        <div className="wrapper_buttons">
          <Link to="/" className="wrapper_button">
            Заявки
          </Link>
          <Link to="/" onClick={handleWithdrawClick} className="wrapper_button">
            Выплаты
          </Link>
          <Link to="/user/payments" className="wrapper_button">
            Реквизиты
          </Link>
          <Link to="/user/settings" className="wrapper_button">
            Настройки
          </Link>
          {user && user.role === "admin" && (
            <Link to="/users/notify" className="wrapper_button admin-link">
              Панель администратора
            </Link>
          )}
        </div>
      </div>

      {isWithdrawOpen && (
        <div className="withdraw-modal" onClick={handleCloseWithdraw}>
          <div className="withdraw-content" onClick={(e) => e.stopPropagation()}>
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
    </>
  );
};

export default Wrapper;
