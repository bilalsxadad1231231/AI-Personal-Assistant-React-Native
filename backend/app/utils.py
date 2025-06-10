from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone

def process_pdf_and_upsert_to_pinecone(file_path: str):
    # Load the PDF document
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    # Initialize the text splitter
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=6000, chunk_overlap=400)
    split_docs = text_splitter.split_documents(documents)

    # Initialize the embedding model
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2', cache_folder='./models')


    # Extract text and generate embeddings
    texts = [doc.page_content for doc in split_docs]
    vectors = model.encode(texts)

    # Initialize Pinecone
    api_key = "pcsk_4BWpBf_9wb4U5KduH8Ecd9FX1FKBM1e89CA5KXUt8m4YxDKJACqXRFMPsRwwvLzVQZA3RR"
    index_name = "app"

    pc = Pinecone(api_key=api_key)
    index = pc.Index(index_name)

    # Prepare data for upsert
    records = []
    for i, (vector, doc) in enumerate(zip(vectors, split_docs)):
        records.append({
            "id": f"vec{i}",
            "values": vector.tolist(),
            "metadata": {"text": doc.page_content}
        })

    # Upsert data into Pinecone
    index.upsert(records)
