"""
Pydantic schemas for request/response models
"""

from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any, Optional
from datetime import datetime

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

class SubmissionHistory(BaseModel):
    id: int
    language: str
    code_length: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

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

class BatchSubmissionStatus(BaseModel):
    id: int
    status: str
    processed_problems: int
    total_problems: int
    total_score: int
    error_message: Optional[str] = None