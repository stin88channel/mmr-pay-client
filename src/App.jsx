// App.jsx
import { useContext, useEffect, useState } from "react"; // Добавлен useState
import { Navigate } from "react-router-dom";
import Header from "./pages/Header";
import Main from "./pages/Main";
import "./App.css";
import "./components/css/PreloadStyle.css";
import { UserContext } from "../context/UserContext";

const App = () => {
  const { user, loading } = useContext(UserContext);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsVisible(true);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="preload">
        <span className="loader"></span>
      </div>
    );
  }

  if (!user || user.auth !== 1) {
    return <Navigate to="/account/signin" replace />;
  }

  return (
    <div className={`app-container ${isVisible ? "visible" : ""}`}>
      <div className="app-content">
        <Header />
        <Main />
      </div>
    </div>
  );
};

export default App;
