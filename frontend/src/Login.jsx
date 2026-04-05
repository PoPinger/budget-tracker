import { useState } from "react";
import { login, register } from "./api";
import { saveAuth } from "./auth";

export default function Login({ onAuthSuccess }) {
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

  return (
    <div className="auth-shell">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <div className="auth-grid">
        <div className="auth-copy">
          <div className="eyebrow">Premium Finance SaaS</div>
          <h1>Kontroluj budżet jak nowoczesny startup.</h1>
          <p>
            Elegancki panel do zarządzania kategoriami, budżetem i wydatkami.
            Wszystko w jednym premium workspace.
          </p>

          <div className="feature-list">
            <div className="feature-item glass">Dashboard miesiąca</div>
            <div className="feature-item glass">Kategorie i limity</div>
            <div className="feature-item glass">Budżety i wydatki</div>
          </div>
        </div>

        <div className="auth-card glass">
          <div className="auth-card-header">
            <div className="eyebrow">{mode === "login" ? "Witaj ponownie" : "Nowe konto"}</div>
            <h2>{mode === "login" ? "Zaloguj się" : "Załóż konto"}</h2>
            <p>
              {mode === "login"
                ? "Wejdź do swojego panelu budżetu."
                : "Stwórz konto i zacznij zarządzać finansami."}
            </p>
          </div>

          <div className="form-stack">
            {mode === "register" && (
              <label className="form-label">
                Imię i nazwisko
                <input
                  className="input"
                  placeholder="Jan Kowalski"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </label>
            )}

            <label className="form-label">
              E-mail
              <input
                className="input"
                placeholder="twoj@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="form-label">
              Hasło
              <input
                className="input"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {message && (
              <div className={message.toLowerCase().includes("błąd") ? "notice error" : "notice success"}>
                {message}
              </div>
            )}

            {mode === "login" ? (
              <button className="primary-btn auth-btn" onClick={handleLogin}>
                Zaloguj się
              </button>
            ) : (
              <button className="primary-btn auth-btn" onClick={handleRegister}>
                Zarejestruj się
              </button>
            )}

            <button
              className="ghost-btn"
              onClick={() => {
                setMessage("");
                setMode(mode === "login" ? "register" : "login");
              }}
            >
              {mode === "login"
                ? "Nie masz konta? Zarejestruj się"
                : "Masz już konto? Zaloguj się"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}