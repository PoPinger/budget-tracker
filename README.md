# Budget Tracker

Fullstackowa aplikacja webowa do kontroli miesięcznych wydatków.

## Funkcje
- ustawianie miesięcznego budżetu,
- limity kategorii,
- dodawanie, edycja i usuwanie wydatków,
- lista wydatków w miesiącu,
- dashboard miesiąca,
- pozostały budżet,
- wykrywanie przekroczeń limitów.

## Stack
### Backend
- FastAPI
- SQLAlchemy 2
- Alembic
- PostgreSQL
- Pydantic

### Frontend
- React
- Vite

## Wymagania
- Python 3.11+
- Node.js 22 (LTS) lub 20.19+
- PostgreSQL (lokalnie albo zdalnie, np. Neon)

## Uruchomienie lokalne

Wszystkie polecenia backendu uruchamiaj z **głównego katalogu repozytorium** (importy to `backend.app...`, a `alembic.ini` leży w katalogu głównym).

### 1. Baza danych

Utwórz pustą bazę, np.:

```bash
createdb budget_tracker
```

### 2. Backend

**macOS / Linux**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env    # uzupełnij DATABASE_URL
alembic upgrade head
uvicorn backend.app.main:app --reload --port 8000
```

**Windows (PowerShell)**

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
copy backend\.env.example backend\.env  # uzupełnij DATABASE_URL
alembic upgrade head
uvicorn backend.app.main:app --reload --port 8000
```

W `cmd.exe` aktywacja to `.venv\Scripts\activate.bat`.

API działa pod http://localhost:8000, dokumentacja pod http://localhost:8000/docs.

### 3. Frontend

W drugim terminalu:

**macOS / Linux**

```bash
cd frontend
cp .env.example .env                    # VITE_API_BASE_URL=http://localhost:8000/api/v1
npm install
npm run dev
```

**Windows (PowerShell)**

```powershell
cd frontend
copy .env.example .env                  # VITE_API_BASE_URL=http://localhost:8000/api/v1
npm install
npm run dev
```

Aplikacja działa pod http://localhost:5173.

## Zmienne środowiskowe

| Plik / miejsce | Zmienna | Opis |
|---|---|---|
| `backend/.env` | `DATABASE_URL` | `postgresql+psycopg://USER:PASSWORD@HOST:5432/DB` |
| `backend/.env` | `SECRET_KEY` | klucz JWT; lokalnie może być pusty (losowy klucz), w produkcji wymagany |
| `backend/.env` | `FRONTEND_URL` | adres frontendu dla CORS; lokalnie localhost jest dozwolony automatycznie |
| `backend/.env` | `APP_ENV` | `development` lub `production` |
| `frontend/.env` | `VITE_API_BASE_URL` | adres API, np. `http://localhost:8000/api/v1` |

Pliki `.env` nie trafiają do repozytorium; commitowane są tylko `*.env.example`. Wartości produkcyjne (Render, Vercel) opisuje `CLAUDE.md`.

## Migracje bazy

```bash
alembic upgrade head                                   # zastosuj migracje
alembic revision --autogenerate -m "krótki opis"       # nowa migracja (przejrzyj plik ręcznie!)
alembic check                                          # modele i migracje muszą być zgodne
```
