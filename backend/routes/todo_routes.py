from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.connection import get_db
from middleware.auth_middleware import get_current_user
from models.user import User
from schemas import todo_schema
from services import todo_service

router = APIRouter()


@router.get("", response_model=List[todo_schema.Todo])
def list_todos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return todo_service.get_todos(db, current_user.id)


@router.post("", response_model=todo_schema.Todo)
def add_todo(
    todo: todo_schema.TodoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return todo_service.create_todo(db, todo, current_user.id)


@router.patch("/{todo_id}", response_model=todo_schema.Todo)
def update_todo(
    todo_id: int,
    todo_update: todo_schema.TodoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = todo_service.update_todo(db, todo_id, todo_update, current_user.id)
    if not updated:
        raise HTTPException(status_code=404, detail="Todo not found")
    return updated


@router.delete("/{todo_id}")
def delete_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ok = todo_service.delete_todo(db, todo_id, current_user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"ok": True}
