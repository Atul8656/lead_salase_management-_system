from sqlalchemy.orm import Session
from models.todo import Todo
from schemas.todo_schema import TodoCreate, TodoUpdate
from typing import List, Optional


def get_todos(db: Session, user_id: int, include_deleted: bool = False) -> List[Todo]:
    query = db.query(Todo).filter(Todo.user_id == user_id)
    if not include_deleted:
        query = query.filter(Todo.is_deleted == False)
    return query.order_by(Todo.created_at.desc()).all()


def create_todo(db: Session, todo: TodoCreate, user_id: int) -> Todo:
    db_todo = Todo(**todo.model_dump(), user_id=user_id)
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo


def update_todo(db: Session, todo_id: int, todo_update: TodoUpdate, user_id: int) -> Optional[Todo]:
    db_todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user_id).first()
    if not db_todo:
        return None
    
    update_data = todo_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_todo, key, value)
    
    db.commit()
    db.refresh(db_todo)
    return db_todo


def delete_todo(db: Session, todo_id: int, user_id: int) -> bool:
    db_todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user_id).first()
    if not db_todo:
        return False
    # Physical delete if you want, but user asked for soft delete logic in UI
    # We maintain is_deleted flag for "pending delete" logic if needed by backend too
    db_todo.is_deleted = True
    db.commit()
    return True
