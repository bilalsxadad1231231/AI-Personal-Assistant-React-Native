from typing import Optional, List, Dict, Literal
from langgraph.graph import MessagesState
from typing_extensions import TypedDict

class State(MessagesState):
    """
    Represents the state of the graph.

    Attributes:
        messages: The history of messages (inherited).
        next: The next node to route to.
        search_query: The query used for web search.
        urls_found: A list of URLs found by the search relevant to the query.
        scraped_content: A dictionary mapping URLs to their scraped content.
        # You might add other fields as needed, e.g., research_summary
    """
    # messages attribute is inherited from MessagesState (List[BaseMessage])
    next: str
    search_query: Optional[str]
    urls_found: Optional[List[str]]
    scraped_content: Optional[Dict[str, str]]


class Router(TypedDict):
    """Worker to route to next. If no workers needed, route to FINISH."""
    next: Literal["researcher", "file_creator", "FINISH"]