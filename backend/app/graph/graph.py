from langgraph.graph import StateGraph, END, START
from app.agents.research_agent import research_node
from app.agents.vison_agent import imageAgent
from app.agents.rag_agent import rag_agent_node
from app.agents.supervisor import supervisor_node
from app.core.state import State


builder = StateGraph(State)
builder.add_edge(START, "supervisor")
builder.add_node("supervisor", supervisor_node)
builder.add_node("researcher", research_node)
builder.add_node("vision_agent", imageAgent)
builder.add_node("rag_agent", rag_agent_node)

# Add conditional edges from supervisor to the possible destinations
builder.add_conditional_edges(
    "supervisor",
    lambda state: state["next"],
    {
        "researcher": "researcher",
        "vision_agent": "vision_agent",
        "rag_agent": "rag_agent",
        END: END
    }
)

# Add edges back to supervisor
builder.add_edge("researcher", END)
builder.add_edge("vision_agent", END)

# Create the graph
graph = builder.compile()

msg = " I want you to search for me about who is the current vc of university of engineering and technology Mardan ?"
print("working")


