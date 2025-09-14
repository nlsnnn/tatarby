from fastapi import APIRouter, File, UploadFile

from app.api.speech.service import SpeechService
from app.core.schemas.speech import TextRequest


router = APIRouter(prefix="/speech", tags=["Speech"])


@router.post("/recognize")
async def recognize_speech(file: UploadFile = File(...)):
    return await SpeechService.recognize(file)


@router.post("/check-text")
async def check_text(data: TextRequest):
    return await SpeechService.check_text(data.text)


@router.post("/synthesize")
async def synthesize_speech(data: TextRequest, speaker: str = "alsu"):
    return await SpeechService.synthesize(data.text, speaker)


@router.post("/translate")
async def translate_text(data: TextRequest, direction: str = "rus2tat"):
    return await SpeechService.translate(data.text, direction)
