import { useState } from "react";
import { login, register } from "../api";
import { saveAuth } from "../auth";

export default function LoginPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    setMessage("");

    try {
      const data = await login(email, password);
      saveAuth(data.access_token, data.user);
      onAuthSuccess();
    } catch (error) {
      setMessage(error.message || "Błąd logowania");
    }
  };

  const handleRegister = async () => {
    setMessage("");

    try {
      const data = await register({
        full_name: fullName,
        email,
        password,
      });

      saveAuth(data.access_token, data.user);
      onAuthSuccess();
    } catch (error) {
      setMessage(error.message || "Błąd rejestracji");
    }
  };

  const submit = (event) => {
    event.preventDefault();
    if (mode === "login") handleLogin();
    else handleRegister();
  };

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <div className="auth-copy">
          <div className="brand auth-brand">
            <img className="brand-logo" src="/icons/logo-transparent.png" alt="" />
            Budget Tracker
          </div>
          <div className="chip only-desktop">Premium Finance SaaS</div>
          <h1 className="auth-title">Kontroluj budżet jak nowoczesny startup.</h1>
          <p className="auth-lead only-desktop">
            Elegancki panel do zarządzania kategoriami, budżetem i wydatkami.
            Wszystko w jednym premium workspace.
          </p>

          <div className="feature-list only-desktop">
            <div className="feature-item">Dashboard miesiąca</div>
            <div className="feature-item">Kategorie i limity</div>
            <div className="feature-item">Budżety i wydatki</div>
          </div>
        </div>

        <div className="card auth-card">
          <div className="auth-card-header">
            <div className="chip">{mode === "login" ? "Witaj ponownie" : "Nowe konto"}</div>
            <h2>{mode === "login" ? "Zaloguj się" : "Załóż konto"}</h2>
            <p className="muted">
              {mode === "login"
                ? "Wejdź do swojego panelu budżetu."
                : "Stwórz konto i zacznij zarządzać finansami."}
            </p>
          </div>

          <form className="form-stack" onSubmit={submit} noValidate>
            {mode === "register" && (
              <div className="field">
                <label htmlFor="auth-name">Imię i nazwisko</label>
                <input
                  id="auth-name"
                  className="input"
                  placeholder="Jan Kowalski"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            <div className="field">
              <label htmlFor="auth-email">E-mail</label>
              <input
                id="auth-email"
                className="input"
                type="email"
                placeholder="twoj@email.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="auth-password">Hasło</label>
              <input
                id="auth-password"
                className="input"
                placeholder="••••••••"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {message && (
              <div className="notice notice-error" role="alert">
                {message}
              </div>
            )}

            <button className="btn btn-primary btn-block" type="submit">
              {mode === "login" ? "Zaloguj się" : "Zarejestruj się"}
            </button>

            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setMessage("");
                setMode(mode === "login" ? "register" : "login");
              }}
            >
              {mode === "login"
                ? "Nie masz konta? Zarejestruj się"
                : "Masz już konto? Zaloguj się"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
