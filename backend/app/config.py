from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://watech:watech@localhost:5432/watechimoveis"
    app_env: str = "development"
    cors_origins: str = "http://localhost:3000,http://localhost:5173,http://localhost:5174"
    api_prefix: str = "/api/v1"
    admin_email: str = "admin@watech.com"
    admin_password: str = "admin123"
    jwt_secret: str = "change-me-in-production"
    jwt_expire_minutes: int = 480
    upload_dir: str = "uploads"
    max_upload_mb: int = 5

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
