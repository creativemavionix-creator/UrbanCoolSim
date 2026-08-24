import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "UrbanCoolSim"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    
    # Security & Auth
    SECRET_KEY: str = Field(
        default="urbancoolsim_super_secret_jwt_key_32_bytes_long_change_in_prod!",
        env="SECRET_KEY"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./urbancoolsim.db",
        env="DATABASE_URL"
    )
    SYNC_DATABASE_URL: str = Field(
        default="sqlite:///./urbancoolsim.db",
        env="SYNC_DATABASE_URL"
    )
    
    # Redis & Task Queue
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    
    # Computational Safety & Resource Constraints
    MAX_SIMULATION_CELLS: int = 1000000  # Max 1 million grid cells per simulation
    MAX_OPTIMIZATION_ITERATIONS: int = 200
    MAX_POPULATION_SIZE: int = 100
    JOB_TIMEOUT_SECONDS: int = 600  # 10 minutes
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Storage
    STORAGE_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "models"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "reports"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "rasters"), exist_ok=True)
