from langchain_core.tools import tool
from langchain_core.messages import HumanMessage
from langgraph.types import Command
from app.core.state import State
from langgraph.graph import END
from typing import Literal
import requests
from bs4 import BeautifulSoup
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from langchain_community.tools.tavily_search import TavilySearchResults
from transformers import AutoConfig



pinecone_key = 'pcsk_4BWpBf_9wb4U5KduH8Ecd9FX1FKBM1e89CA5KXUt8m4YxDKJACqXRFMPsRwwvLzVQZA3RR'

tavily_tool = TavilySearchResults(max_results=5, tavily_api_key="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")
# Load the sentence transformer model

# config = AutoConfig.from_pretrained('sentence-transformers/all-MiniLM-L6-v2', model_type='bert')
# model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2', config=config)
model = ""

@tool
def scrape_and_clean_url(url: str) -> str:
    """
    Scrapes a URL and returns clean, readable text from the page.
    """
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
    except requests.RequestException as e:
        return f"Error fetching URL: {e}"

    soup = BeautifulSoup(response.text, 'html.parser')

    # Remove scripts and styles
    for tag in soup(['script', 'style', 'noscript']):
        tag.decompose()

    # Extract text and clean it
    text = soup.get_text(separator='\n')
    clean_text = '\n'.join(line.strip() for line in text.splitlines() if line.strip())

    # Limit length if needed
    max_chars = 5000  # to keep it concise for LLM
    return clean_text[:max_chars] + ("\n...[truncated]" if len(clean_text) > max_chars else "")

# Define file creation tools
@tool
def create_file(filename: str, content: str) -> str:
    """Create a file with the given filename and content."""
    try:
        with open(filename, "w") as f:
            f.write(content)
        return f"File {filename} created successfully."
    except Exception as e:
        return f"Error creating file: {str(e)}"
 



@tool
def retrieval_tool(query_text: str) -> list:
    """
    Retrieve relevant text chunks from a Pinecone vector database based on a query.

    Parameters:
    - query_text (str): The user's search query.

    Returns:
    - List of relevant text snippets.
    """
    print("*"*100)
    print("*"*100)
    print(query_text)
    print("*"*100)
    print("*"*100)
    
    # Initialize the embedding model
    # model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    index_name = 'app'
    # Generate the embedding for the query
    query_vector = model.encode(query_text).tolist()
    
    # Initialize Pinecone
    pc = Pinecone(api_key=pinecone_key)
    index = pc.Index(index_name)
    
    # Query Pinecone for similar vectors
    response = index.query(
        vector=query_vector,
        top_k=5,
        include_metadata=True
    )
    
    # Extract and return the relevant texts
    results = []
    for match in response['matches']:
        metadata = match.get('metadata', {})
        text = metadata.get('text', '')
        results.append(text)
    
    return results
