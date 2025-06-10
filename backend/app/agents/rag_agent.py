from app.tools.agent_tools import retrieval_tool
from langchain_core.messages import HumanMessage
from langgraph.types import Command
from app.core.state import State
from langgraph.graph import END
from typing import Literal
from app.prompt import rag_prompt
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os

def rag_agent_node(state: State) -> Command[State]:

    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
    groq_api_key = os.getenv("GROQ_API_KEY")

    llm = ChatGroq(
    api_key= groq_api_key,
    model_name="llama-3.3-70b-versatile",
    temperature=0
    )

    rag_agent = create_react_agent(
    llm,
    tools=[retrieval_tool],
    prompt=rag_prompt
    )

    result = rag_agent.invoke(state)
    return Command(
        update={
            "messages": state["messages"] + [
                HumanMessage(content=result["messages"][-1].content, name="summarizer")
            ]
        },
        goto=END,
    )
