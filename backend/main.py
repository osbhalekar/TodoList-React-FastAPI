from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Allow the React dev server (Vite) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173'],
    allow_methods=['*'],
    allow_headers=['*'],
)


class Todo(BaseModel):
    title: str
    description: str
    completed: bool


todos = []

@app.get("/")
def home():
    return {
        "message": "Todo List API is running!",
        "docs": "/docs",
        "todos": "/todos"
    }

@app.post('/todos')
def postTodo(todo: Todo):
    todos.append(todo)

    return {
        'message': 'Todo added successfully!!!',
        'data': todo
    }


@app.get('/todos')
def getTodos():
    return {
        'message': 'Todos Fetched Successfully!!!',
        'data': todos
    }


@app.get('/todos/{id}')
def getSingleTodo(id: int):
    if id < 1 or id > len(todos):
        raise HTTPException(
            status_code=404,
            detail='Todo Not Found!!!'
        )
    return {
        'message': 'Todo Fetched Successfully!!!',
        'data': todos[id - 1]
    }


@app.put('/todos/{id}')
def updateTodo(id: int, todo: Todo):
    if id < 1 or id > len(todos):
        raise HTTPException(
            status_code=404,
            detail='Todo Not Found!!!'
        )
    todos[id - 1] = todo
    return {
        'message': 'Todo Updated Successfully!!!',
        'data': todos[id - 1]
    }


@app.delete('/todos/{id}')
def deleteTodo(id: int):
    if id < 1 or id > len(todos):
        raise HTTPException(
            status_code=404,
            detail='Todo Not Found!!!'
        )
    deleted_todo = todos.pop(id - 1)
    return {
        'message': 'Todo Deleted Successfully!!!',
        'data': deleted_todo
    }
