from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    name: str
    creci: str | None = None
    whatsapp: str | None = None
    role: str
    is_active: bool


class AgentCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=2, max_length=120)
    creci: str | None = Field(default=None, max_length=30)
    whatsapp: str | None = Field(default=None, max_length=30)


class AgentUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=6)
    name: str | None = Field(default=None, min_length=2, max_length=120)
    creci: str | None = None
    whatsapp: str | None = None
    is_active: bool | None = None
