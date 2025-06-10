from langchain_core.messages import HumanMessage
import base64
from langchain_groq import ChatGroq
from langgraph.graph import END
from langgraph.types import Command
from app.core.state import State
from dotenv import load_dotenv
import os


def imageAgent(state: State) -> Command :
    # Read and encode the image
    # image_path = state.get("image_path")
    path_file = "I:/COUSERA ML WORK/MY_PROJECTS/MAD_SEM_PROJECT_AI_ASSISTANT/personnalAssistant(MAD)(FRONT)/backend/app/src/image_path.txt"
    
    # Load environment variables from .env file in the app folder
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
    
    # Get API key from environment variables
    groq_api_key = os.getenv("GROQ_API_KEY")
    
    vision_llm = ChatGroq(
        model_name="meta-llama/llama-4-scout-17b-16e-instruct",
        api_key=groq_api_key,
        temperature=0.7
    )

    # Read the actual image path from the file
    with open(path_file, "r") as f:
        image_path = f.read().strip()
    
    print(image_path)
    if not image_path:
        raise ValueError("image_path is required in the state.")
    
    with open(image_path, "rb") as image_file:
        image_bytes = image_file.read()
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
    
    # Initialize the Groq Chat model


    userMessage = state["messages"][-1].content
    
    # Build the prompt
    prompt = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": userMessage},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"}}
            ]
        }
    ]
    
    # Invoke the model
    response = vision_llm.invoke(prompt)
    
    # Return the model's response into the new state
    return Command(
        update={
            "messages": state["messages"] + [
                HumanMessage(content=response.content, name="researcher")
            ]
        },
        goto=END,
    )
     