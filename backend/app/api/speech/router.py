from fastapi import APIRouter, File, UploadFile

from app.api.speech.service import SpeechService


router = APIRouter(prefix="/speech", tags=["Speech"])


@router.post("/recognize")
async def recognize_speech(file: UploadFile = File(...)):
    return await SpeechService.recognize(file)


@router.post("/check-text")
async def check_text(text: str):
    return await SpeechService.check_text(text)

@router.post("/synthesize")
async def synthesize_speech(text: str, speaker: str = "alsu"):
    return await SpeechService.synthesize(text, speaker)


@router.post("/translate")
async def translate_text(text: str, direction: str = "rus2tat"):
    return await SpeechService.translate(text, direction)