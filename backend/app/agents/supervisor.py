from typing import Literal
from langgraph.graph import END
from langgraph.types import Command
from app.core.state import State, Router
from app.prompt import system_prompt
from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os


def supervisor_node(state: State) -> Command[State]:

    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
    groq_api_key = os.getenv("GROQ_API_KEY")

    llm = ChatGroq(
    api_key= groq_api_key,
    model_name="llama-3.3-70b-versatile",
    temperature=0
)

    messages = [
        {"role": "system", "content": system_prompt},
    ] + state["messages"]
    response = llm.with_structured_output(Router).invoke(messages)
    goto = response["next"]
    if goto == "FINISH":
        goto = END

    return Command(goto=goto, update={"next": goto})

