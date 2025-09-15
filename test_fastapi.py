from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List

app = FastAPI()

# Store frontend clients
clients: List[WebSocket] = []

@app.websocket("/frontend")
async def frontend_socket(ws: WebSocket):
    await ws.accept()
    clients.append(ws)
    try:
        while True:
            msg = await ws.receive_text()  # keep alive
            print("Frontend keep-alive:", msg)
    except WebSocketDisconnect:
        clients.remove(ws)

@app.websocket("/matlab")
async def matlab_socket(ws: WebSocket):
    await ws.accept()
    print("receiving")
    try:
        while True:
            data = await ws.receive_text()
            # Forward MATLAB/telemetry data to frontend clients
            for client in clients:
                await client.send_text(data)
    except WebSocketDisconnect:
        print("MATLAB disconnected")
        
#uvicorn test_fastapi:app --reload --port 8000