import { useState, useContext, useRef } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { UserContext } from '../../context/UserContext';
import Header from "./Header";
import './css/AdminNotify.css';

function AdminNotify() {
    const { user } = useContext(UserContext);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [image, setImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const editorRef = useRef(null);

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    const applyStyle = (style) => {
        document.execCommand(style, false, null);
        editorRef.current?.focus();
    };

    // Убираем dangerouslySetInnerHTML и используем прямое управление содержимым
    const handleEditorInput = (e) => {
        const content = e.currentTarget.innerHTML;
        setMessage(content);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!title.trim() || !message.trim()) {
            toast.error('Введите заголовок и текст уведомления');
            return;
        }
    
        try {
            setIsLoading(true);
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('message', message.trim());
            if (image) {
                formData.append('image', image);
            }
    
            console.log('Отправляемые данные:', {
                title: title.trim(),
                message: message.trim(),
                hasImage: !!image
            });
    
            const response = await axios.post('/api/notifications', formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            console.log('Ответ сервера:', response.data);
            toast.success('Уведомление успешно отправлено');
            setTitle('');
            setMessage('');
            setImage(null);
            if (editorRef.current) {
                editorRef.current.innerHTML = '';
            }
        } catch (error) {
            console.error('Ошибка при отправке уведомления:', error);
            console.error('Детали ошибки:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.error || error.message || 'Неизвестная ошибка при отправке уведомления';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <Header />
            <main>
                <div className="main_container">
                    <div className="applications">
                        <div className="notify-container">
                            <div className="notify-header">
                                <h2>Отправка уведомлений</h2>
                                <p className="admin-info">Администратор: {user?.login}</p>
                            </div>
                            <form onSubmit={handleSubmit} className='admin_form'>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Введите заголовок..."
                                    className="admin-input"
                                />
                                <div className="editor-toolbar">
                                    <button type="button" onClick={() => applyStyle('bold')}>
                                        <b>Ж</b>
                                    </button>
                                    <button type="button" onClick={() => applyStyle('italic')}>
                                        <i>К</i>
                                    </button>
                                    <button type="button" onClick={() => applyStyle('underline')}>
                                        <u>Ч</u>
                                    </button>
                                </div>
                                <div
                                    ref={editorRef}
                                    contentEditable="true"
                                    className="admin-editor"
                                    onInput={handleEditorInput}
                                    role="textbox"
                                    aria-multiline="true"
                                />
                                <div className="file-input-container">
                                    <input
                                        type="file"
                                        onChange={handleImageChange}
                                        accept="image/*"
                                        className="admin-file-input"
                                        id="file-input"
                                    />
                                    <label htmlFor="file-input" className="file-input-label">
                                        {image ? 'Файл выбран' : 'Прикрепить изображение'}
                                    </label>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="send-button"
                                >
                                    {isLoading ? 'Отправка...' : 'Отправить'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default AdminNotify;