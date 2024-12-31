import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const EditPaymentOptionForm = ({ option, onClose, onRefresh }) => {
  const [formData, setFormData] = useState({
    name: '',
    limit: 0,
    timeout: 0,
    maxRequests: 0,
    botRequisites: '',
    comment: '',
  });

  // Заполняем форму данными существующего реквизита
  useEffect(() => {
    if (option) {
      setFormData({
        name: option.name,
        limit: option.limit,
        timeout: option.timeout,
        maxRequests: option.maxRequests,
        botRequisites: option.botRequisites,
        comment: option.comment,
      });
    }
  }, [option]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditPaymentOption = async (e) => {
    e.preventDefault();
  
    // Валидация данных перед отправкой
    if (!formData.name || !formData.botRequisites) {
      toast.error('Пожалуйста, заполните все обязательные поля.');
      return;
    }
  
    // Логируем данные перед отправкой
    console.log("Отправляемые данные:", formData);
    console.log("ID реквизита для обновления:", option._id);
  
    try {
      const response = await axios.put(`/api/payment-options/${option._id}`, formData, {
        withCredentials: true,
      });
  
      // Логируем ответ от сервера
      console.log("Ответ от сервера:", response.data);
  
      if (response.data) {
        toast.success('Реквизит успешно обновлен');
        onRefresh(); // Обновляем список платежных опций
        onClose(); // Закрываем форму редактирования
      } else {
        toast.error('Не удалось обновить реквизит. Пожалуйста, попробуйте снова.');
      }
    } catch (error) {
      console.error('Ошибка при обновлении реквизита:', error);
      const errorMessage =
        error.response?.data?.error ||
        'Не удалось обновить реквизит. Пожалуйста, попробуйте снова.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="edit-payment-option-form">
      <h2>Редактирование реквизита</h2>
      <form onSubmit={handleEditPaymentOption}>
        <label>
          Название:
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Лимит:
          <input
            type="number"
            name="limit"
            value={formData.limit}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Таймаут:
          <input
            type="number"
            name="timeout"
            value={formData.timeout}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Максимальное количество заявок:
          <input
            type="number"
            name="maxRequests"
            value={formData.maxRequests}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Реквизиты для бота:
          <input
            type="text"
            name="botRequisites"
            value={formData.botRequisites}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Примечание:
          <input
            type="text"
            name="comment"
            value={formData.comment}
            onChange={handleInputChange}
          />
        </label>
        <button type="submit">Сохранить изменения</button>
        <button type="button" onClick={onClose}>Закрыть</button>
      </form>
    </div>
  );
};

export default EditPaymentOptionForm;