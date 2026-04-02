# Budget Tracker

Fullstackowa aplikacja webowa do kontroli miesięcznych wydatków.

## Funkcje
- ustawianie miesięcznego budżetu,
- limity kategorii,
- dodawanie wydatków,
- usuwanie wydatków,
- historia wydatków,
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
- TypeScript
- Vite
- React Router

## Uruchomienie lokalne

### Backend
```cmd
cd budget-tracker
python -m venv .venv
.venv\Scripts\activate.bat
pip install -r backend\requirements.txt
alembic upgrade head
uvicorn backend.app.main:app --reload