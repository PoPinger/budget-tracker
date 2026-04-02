import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="page">
      <section className="card not-found-card">
        <h1>404</h1>
        <p>Ta strona nie istnieje.</p>
        <Link to="/" className="primary-link">
          Wróć do dashboardu
        </Link>
      </section>
    </div>
  );
}