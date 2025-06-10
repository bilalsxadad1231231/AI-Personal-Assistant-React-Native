import requests
import json

# API base URL
BASE_URL = "https://5faa-223-123-88-223.ngrok-free.app"

def test_signup(username, email, password):
    """
    Test the signup endpoint
    
    Args:
        username (str): Desired username
        email (str): User's email
        password (str): User's password
    
    Returns:
        dict: Response from the API
    """
    # Endpoint URL
    url = f"{BASE_URL}/login"
    
    # Request payload
    payload = {
        "email": email,
        "password": password
    }
    
    # Headers
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        # Make POST request
        response = requests.post(url, json=payload, headers=headers)
        
        # Print response details
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        return response.json()
    
    except requests.exceptions.RequestException as e:
        print(f"Error making request: {e}")
        return None

def test_chat(query):
    """
    Test the /chat endpoint
    Args:
        query (str): The user query to send to the chat endpoint
    Returns:
        dict: Response from the API
    """
    url = f"{BASE_URL}/chat"
    payload = {"query": query}
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error making request: {e}")
        return None

if __name__ == "__main__":
    # Example usage
    test_user = {
        "username": "testuser1",
        "email": "test2@example.com",
        "password": "abcdefghij"
    }
    
    print("Testing signup endpoint...")
    print(test_user)
    result = test_signup( 
        username=test_user["username"],
        email=test_user["email"],
        password=test_user["password"]
    )
    # print(result)
    # print("\nTesting chat endpoint...")
    # chat_result = test_chat("Who is the current VC of University of Engineering and Technology Mardan?") 