from app.graph.graph import graph
image_path = "app/src/image/test_image.png"
t = ""

msg = "I want you to tell me about the what kind of  home automation devices are there in the documents"
for s in graph.stream(
    {"messages": [("user", msg)]}, subgraphs=True
):
    # print(s)
    t = s
    # print("----")
# print(t)
print(t[-1]["rag_agent"]["messages"][-1].content)


