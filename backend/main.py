from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import timedelta
import schemas
import auth
import database
from app.graph.graph import graph
from pydantic import BaseModel
from typing import List, Any
import shutil
import os
from app.utils import process_pdf_and_upsert_to_pinecone

app = FastAPI()
# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    results: List[Any]

@app.post("/signup", response_model=schemas.User)
def create_user(user: schemas.UserCreate):
    # Check if email already exists
    db_user = database.get_user_by_email(user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username already exists
    db_user = database.get_user_by_username(user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user
    hashed_password = auth.get_password_hash(user.password)
    db_user = database.create_user(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    return db_user

@app.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin):
    # Authenticate user
    user = auth.authenticate_user(user.email, user.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: dict = Depends(auth.get_current_user)):
    return current_user

@app.get("/")
async def root():
    return {"message": "Welcome to the Personal Assistant API"}

@app.get("/test")
async def test_endpoint():
    return {
        "status": "success",
        "message": "API is working correctly",
        "data": {
            "test": "This is a test response",
            "timestamp": "2024-03-21T12:00:00Z"
        }
    }

@app.post("/echo")
async def echo_message(message: dict):
    return {
        "status": "success",
        "received_message": message,
        "timestamp": "2024-03-21T12:00:00Z"
    }

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    last_content = ""
    for s in graph.stream({"messages": [("user", request.query)]}, subgraphs=True):
        last_content = s
    # Check if vision_agent content exists and use it if available
    if "vision_agent" in last_content[-1]:
        last_content = last_content[-1]["vision_agent"]["messages"][-1].content
    else:
        last_content = last_content[-1]["researcher"]["messages"][-1].content
    return {"content": last_content}


@app.post("/upload-image")
async def upload_image(name: str = Form(...), file: UploadFile = File(...)):
    # Define the directory to save images
    save_dir = "I:/COUSERA ML WORK/MY_PROJECTS/MAD_SEM_PROJECT_AI_ASSISTANT/personnalAssistant(MAD)(FRONT)/backend/app/src/image"
    os.makedirs(save_dir, exist_ok=True)
    # Create the full path with the provided name and original file extension
    ext = os.path.splitext(file.filename)[1]
    save_path = os.path.join(save_dir, f"{name}{ext}")
    
    # Save the file
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Save the image path to a text file
    image_path_file = "I:/COUSERA ML WORK/MY_PROJECTS/MAD_SEM_PROJECT_AI_ASSISTANT/personnalAssistant(MAD)(FRONT)/backend/app/src/image_path.txt"
    with open(image_path_file, "w") as f:
        f.write(save_path)
    
    return {"message": "Image uploaded successfully", "filename": f"{name}{ext}", "path": save_path}

@app.post("/update-api-key")
async def update_api_key(api_key: str):
        try:
            # Path to .env file
            env_path = os.path.join(os.path.dirname(__file__), '.', 'app', '.env')
            print(env_path)
            print(api_key)
            # Create app directory if it doesn't exist
            os.makedirs(os.path.dirname(env_path), exist_ok=True)
            
            # Directly write the new API key to .env file
            with open(env_path, 'w') as file:
                file.write(f'GROQ_API_KEY={api_key}\n')
            
            return {
                "status": "success",
                "message": "API key updated successfully"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to update API key: {str(e)}"
            }

@app.post("/process-pdf")
async def process_pdf(file: UploadFile = File(...)):
    # Define the directory to save PDFs
    save_dir = "app/src/pdf"
    os.makedirs(save_dir, exist_ok=True)
    
    # Create the full path with the original filename
    save_path = os.path.join(save_dir, file.filename)
    
    # Save the uploaded file
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Process the PDF and upsert to Pinecone
    process_pdf_and_upsert_to_pinecone(save_path)
    
    return {"message": "PDF processed and upserted to Pinecone successfully", "filename": file.filename}


