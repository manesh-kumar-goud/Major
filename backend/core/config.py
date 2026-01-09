"""
Configuration management using Pydantic Settings
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    # App Configuration
    APP_NAME: str = "Stock Market Forecasting API"
    VERSION: str = "2.0.0"
    DEBUG: bool = Field(default=False, env="DEBUG")
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    
    # Server Configuration
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=5000, env="PORT")
    
    # CORS Configuration (stored as string, parsed as list)
    CORS_ORIGINS_STR: str = Field(
        default="http://localhost:3000,http://localhost:5173",
        env="CORS_ORIGINS_STR"
    )
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Parse CORS_ORIGINS from comma-separated string"""
        cors_str = self.CORS_ORIGINS_STR
        if isinstance(cors_str, str) and cors_str.strip():
            return [origin.strip() for origin in cors_str.split(",") if origin.strip()]
        return ["http://localhost:3000", "http://localhost:5173"]
    
    # Security
    SECRET_KEY: str = Field(default="dev-secret-key-change-in-production", env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # RapidAPI Configuration
    RAPIDAPI_BASE_URL: str = Field(
        default="https://yahoo-finance15.p.rapidapi.com/api/v1",
        env="RAPIDAPI_BASE_URL"
    )
    RAPIDAPI_HOST: str = Field(
        default="yahoo-finance15.p.rapidapi.com",
        env="RAPIDAPI_HOST"
    )
    RAPIDAPI_KEY: str = Field(default="", env="RAPIDAPI_KEY")
    API_REQUEST_TIMEOUT: int = Field(default=30, env="API_REQUEST_TIMEOUT")
    API_MAX_RETRIES: int = Field(default=3, env="API_MAX_RETRIES")
    
    # Model Configuration
    MODEL_CACHE_TTL: int = Field(default=3600, env="MODEL_CACHE_TTL")
    DATA_CACHE_TTL: int = Field(default=1800, env="DATA_CACHE_TTL")
    SEQUENCE_LENGTH: int = Field(default=60, env="SEQUENCE_LENGTH")
    DEFAULT_PREDICTION_DAYS: int = Field(default=30, env="DEFAULT_PREDICTION_DAYS")
    
    # MLflow Configuration
    MLFLOW_TRACKING_URI: str = Field(default="file:./mlruns", env="MLFLOW_TRACKING_URI")
    MLFLOW_ENABLED: bool = Field(default=True, env="MLFLOW_ENABLED")
    
    # Optuna Configuration
    OPTUNA_ENABLED: bool = Field(default=False, env="OPTUNA_ENABLED")
    OPTUNA_N_TRIALS: int = Field(default=20, env="OPTUNA_N_TRIALS")
    
    # Redis Configuration (optional)
    REDIS_URL: str = Field(default="", env="REDIS_URL")
    USE_REDIS: bool = Field(default=False, env="USE_REDIS")
    
    # Database (if needed in future)
    DATABASE_URL: str = Field(default="", env="DATABASE_URL")
    
    # Supabase Configuration
    SUPABASE_URL: str = Field(default="", env="SUPABASE_URL")
    SUPABASE_KEY: str = Field(default="", env="SUPABASE_KEY")  # service_role key for backend
    SUPABASE_ANON_KEY: str = Field(default="", env="SUPABASE_ANON_KEY")  # anon key (optional)
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

settings = get_settings()


