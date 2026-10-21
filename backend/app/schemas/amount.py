from typing import Annotated

from pydantic import AfterValidator
from pydantic_core import PydanticCustomError

# Kwoty w bazie to Numeric(12, 2), więc największa możliwa wartość to 9 999 999 999,99.
MAX_AMOUNT = 9_999_999_999.99


def _check_max_amount(value: float) -> float:
    # Porównujemy po zaokrągleniu do groszy, tak jak zapisze to Postgres.
    if round(value, 2) > MAX_AMOUNT:
        raise PydanticCustomError("amount_too_large", "Kwota jest za duża.")
    return value


Amount = Annotated[float, AfterValidator(_check_max_amount)]
