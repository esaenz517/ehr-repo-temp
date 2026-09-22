'''
Providers CRUD
DB access functions for providers - list, get, create, delete.
'''

from sqlalchemy.orm import Session

from app.models.providers import Provider as ProviderModel
from app.schemas.providers import ProviderCreate


# Gets all providers from the DB.
def list_providers(db: Session):
    return db.query(ProviderModel).order_by(ProviderModel.provider_id).all()


# Gets one provider by id, or None if it doesn't exist.
def get_provider(db: Session, provider_id: int):
    return db.query(ProviderModel).filter(ProviderModel.provider_id == provider_id).first()


# Inserts a new provider and returns it (with its new id).
def create_provider(db: Session, provider: ProviderCreate):
    db_provider = ProviderModel(
        first_name=provider.first_name,
        last_name=provider.last_name,
        specialty=provider.specialty,
        phone=provider.phone,
        email=provider.email,
    )
    db.add(db_provider)
    db.commit()
    db.refresh(db_provider)
    return db_provider


# Deletes a provider by id. Returns True if a row was actually deleted.
def delete_provider(db: Session, provider_id: int) -> bool:
    db_provider = get_provider(db, provider_id)
    if db_provider is None:
        return False
    db.delete(db_provider)
    db.commit()
    return True
