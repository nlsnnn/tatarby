from pydantic import BaseModel


class RecognizeResponse(BaseModel):
    text: str
    feedback: str
    structure: dict
