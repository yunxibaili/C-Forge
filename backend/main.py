from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from tracer import trace_source

app = FastAPI(title="C-Forge backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class RunRequest(BaseModel):
    code: str


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/run")
def run(req: RunRequest):
    code = req.code
    if not code.strip():
        return {"ok": False, "events": [], "stats": {}, "compile_error": "empty source", "trace_error": None, "truncated": False}
    if len(code) > 20000:
        return {"ok": False, "events": [], "stats": {}, "compile_error": "source too large", "trace_error": None, "truncated": False}
    return trace_source(code)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
