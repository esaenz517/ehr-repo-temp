'''
Items CRUD
DB access functions for items - list, get, create, delete.
Use this file as a template to implement CRUD for a new feature/resource.
'''

from sqlalchemy.orm import Session

from app.models.items import Item as ItemModel
from app.schemas.items import ItemCreate


# Gets all items from the DB.
def list_items(db: Session):
    return db.query(ItemModel).order_by(ItemModel.id).all()


# Gets one item by id, or None if it doesn't exist.
def get_item(db: Session, item_id: int):
    return db.query(ItemModel).filter(ItemModel.id == item_id).first()


# Inserts a new item and returns it (with its new id and created_at).
def create_item(db: Session, item: ItemCreate):
    db_item = ItemModel(name=item.name, description=item.description)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


# Deletes an item by id. Returns True if a row was actually deleted.
def delete_item(db: Session, item_id: int) -> bool:
    db_item = get_item(db, item_id)
    if db_item is None:
        return False
    db.delete(db_item)
    db.commit()
    return True
