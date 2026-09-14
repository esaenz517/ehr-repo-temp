'''
Items Router
This file defines API endpoints for managing items. It includes routes for listing, retrieving, creating, and deleting items.
Use this router as a template to implement feature and objects
'''



from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import items as crud
from app.database import get_db
from app.schemas.items import Item, ItemCreate

router = APIRouter(prefix="/items", tags=["items"])


@router.get("", response_model=list[Item])
def list_items(db: Session = Depends(get_db)):
    return crud.list_items(db)


@router.get("/{item_id}", response_model=Item)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = crud.get_item(db, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("", response_model=Item, status_code=201)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    return crud.create_item(db, item)


@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_item(db, item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Item not found")
