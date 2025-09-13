from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict


class TatSoftConfig(BaseModel):
    recognize_url: str = "https://tat-asr.api.translate.tatar/listening/"
    synthesize_url: str = "https://tat-tts.api.translate.tatar/listening/"
    translate_url: str = "https://v2.api.translate.tatar/"


class HuggingFaceConfig(BaseModel):
    monocorpus: str = "IPSAN/tat_monocorpus_v2"
    parallel_corpus: str = "IPSAN/tatar_translation_dataset"


class DatasetsConfig(BaseModel):
    tat_ru: str
    ru_tat: str


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        case_sensitive=False,
        env_file=(".env"),
        env_nested_delimiter="__",
        env_prefix="APP__",
        extra="ignore",
    )

    tat_soft: TatSoftConfig = TatSoftConfig()
    hugging_face: HuggingFaceConfig = HuggingFaceConfig()
    datasets: DatasetsConfig


settings = Settings()
