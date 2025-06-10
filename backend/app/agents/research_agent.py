from langchain_core.messages import HumanMessage
from langchain_groq import ChatGroq
from app.tools.agent_tools import tavily_tool, scrape_and_clean_url,create_file
from langgraph.prebuilt import create_react_agent
from app.prompt import research_prompt
from langgraph.types import Command
from app.core.state import State
from langgraph.graph import END
from typing import Literal
from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os



def research_node(state: State) -> Command[State]:

    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
    groq_api_key = os.getenv("GROQ_API_KEY")

    llm = ChatGroq(
    api_key= groq_api_key,
    model_name="llama-3.3-70b-versatile",
    temperature=0
)
    research_agent = create_react_agent(
    llm, 
    tools=[tavily_tool, scrape_and_clean_url,create_file], 
    prompt=research_prompt
)

    result = research_agent.invoke(state)
    return Command(
        update={
            "messages": state["messages"] + [
                HumanMessage(content=result["messages"][-1].content, name="researcher")
            ]
        },
        goto=END,
    )
