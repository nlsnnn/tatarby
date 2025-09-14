from pydantic import BaseModel


class TextRequest(BaseModel):
    text: str


class RecognizeResponse(BaseModel):
    text: str
    feedback: str
    structure: dict
