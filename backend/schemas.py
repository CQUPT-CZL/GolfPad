"""
Pydantic schemas for request/response models
"""

from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: (
                (v if v.tzinfo else v.replace(tzinfo=timezone.utc))
                .astimezone(timezone.utc)
                .isoformat()
                .replace('+00:00', 'Z')
            )
        }

class UserLogin(BaseModel):
    username: str
    password: str

# Problem schemas
class ProblemBase(BaseModel):
    task_id: str
    title: str
    description: str
    difficulty: str = "medium"

class ProblemCreate(ProblemBase):
    test_cases: Dict[str, Any]

class ProblemResponse(ProblemBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: (
                (v if v.tzinfo else v.replace(tzinfo=timezone.utc))
                .astimezone(timezone.utc)
                .isoformat()
                .replace('+00:00', 'Z')
            )
        }

class ProblemDetail(ProblemResponse):
    test_cases: Dict[str, Any]

# Submission schemas
class SubmissionBase(BaseModel):
    language: str
    code: str

class SubmissionCreate(SubmissionBase):
    problem_id: int

class SubmissionResponse(SubmissionBase):
    id: int
    user_id: int
    problem_id: int
    code_length: int
    status: str
    result: Optional[Dict[str, Any]] = None
    execution_time: Optional[float] = None
    memory_usage: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: (
                (v if v.tzinfo else v.replace(tzinfo=timezone.utc))
                .astimezone(timezone.utc)
                .isoformat()
                .replace('+00:00', 'Z')
            )
        }

class SubmissionHistory(BaseModel):
    id: int
    user_id: int
    username: str  # 添加用户名字段
    language: str
    code: str  # 添加代码字段，用于查看代码
    code_length: int
    status: str
    execution_time: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: (
                (v if v.tzinfo else v.replace(tzinfo=timezone.utc))
                .astimezone(timezone.utc)
                .isoformat()
                .replace('+00:00', 'Z')
            )
        }

# Stats schemas
class UserStatsResponse(BaseModel):
    user_id: int
    username: str
    total_score: int
    problems_solved: int
    total_submissions: int
    rank: Optional[int] = None
    
    class Config:
        from_attributes = True

class ProblemStatsResponse(BaseModel):
    problem_id: int
    task_id: str
    title: str
    total_submissions: int
    successful_submissions: int
    best_score: Optional[int] = None
    average_score: Optional[float] = None
    
    class Config:
        from_attributes = True

# Leaderboard schemas
class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    total_score: int
    problems_solved: int

class ProblemLeaderboardEntry(BaseModel):
    rank: int
    username: str
    code_length: int
    language: str
    submitted_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: (
                (v if v.tzinfo else v.replace(tzinfo=timezone.utc))
                .astimezone(timezone.utc)
                .isoformat()
                .replace('+00:00', 'Z')
            )
        }

# Evaluation schemas
class EvaluationResult(BaseModel):
    status: str  # "passed", "failed", "error"
    test_results: List[Dict[str, Any]]
    execution_time: Optional[float] = None
    memory_usage: Optional[int] = None
    error_message: Optional[str] = None

# Response wrappers
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int

# Batch submission schemas
class BatchSubmissionResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    total_problems: int
    processed_problems: int
    total_score: int
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: (
                (v if v.tzinfo else v.replace(tzinfo=timezone.utc))
                .astimezone(timezone.utc)
                .isoformat()
                .replace('+00:00', 'Z')
            )
        }

class BatchSubmissionStatus(BaseModel):
    id: int
    status: str
    processed_problems: int
    total_problems: int
    total_score: int
    error_message: Optional[str] = None

class UserProblemScore(BaseModel):
    problem_id: int
    task_id: str
    title: str
    code_length: Optional[int] = None
    score: float

class UserScoresResponse(BaseModel):
    total_score: float
    items: List[UserProblemScore]