import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import useAuth from "../hooks/useAuth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const redirectPath = new URLSearchParams(location.search).get("redirect") || "/dashboard";

  const handleChange = (event) => {
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await register(values);
      navigate(redirectPath);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      mode="register"
      values={values}
      onChange={handleChange}
      onSubmit={handleSubmit}
      error={error}
      loading={loading}
    />
  );
}
