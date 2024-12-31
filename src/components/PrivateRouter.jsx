import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import "./css/PreloadStyle.css";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(UserContext);

  if (loading)
    return (
      <div className="preload">
 
        <span className="loader"></span>
      </div>
    );

  return user ? children : <Navigate to="/account/signin" />;
};

export default PrivateRoute;