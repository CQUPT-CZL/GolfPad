"""
Database models for GolfPad
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    submissions = relationship("Submission", back_populates="user")

class Problem(Base):
    __tablename__ = "problems"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g., "task001"
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String(20), default="medium")  # easy, medium, hard
    test_cases = Column(JSON, nullable=False)  # Store train/test/arc-gen data
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    submissions = relationship("Submission", back_populates="problem")

class Submission(Base):
    __tablename__ = "submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False)
    batch_submission_id = Column(Integer, ForeignKey("batch_submissions.id"), nullable=True)  # Link to batch submission
    language = Column(String(20), nullable=False)  # python, javascript, cpp, etc.
    code = Column(Text, nullable=False)
    code_length = Column(Integer, nullable=False)  # Character count
    status = Column(String(20), nullable=False)  # pending, running, passed, failed
    result = Column(JSON)  # Test results, error messages, etc.
    execution_time = Column(Float)  # Execution time in seconds
    memory_usage = Column(Integer)  # Memory usage in KB
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="submissions")
    problem = relationship("Problem", back_populates="submissions")
    batch_submission = relationship("BatchSubmission", back_populates="submissions")

class UserStats(Base):
    __tablename__ = "user_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    total_score = Column(Integer, default=0)  # Sum of best scores for all solved problems
    problems_solved = Column(Integer, default=0)
    total_submissions = Column(Integer, default=0)
    rank = Column(Integer)  # Global ranking
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")

class ProblemStats(Base):
    __tablename__ = "problem_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id"), unique=True, nullable=False)
    total_submissions = Column(Integer, default=0)
    successful_submissions = Column(Integer, default=0)
    best_score = Column(Integer)  # Shortest code length
    average_score = Column(Float)  # Average code length of successful submissions
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    problem = relationship("Problem")

class BatchSubmission(Base):
    __tablename__ = "batch_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)  # Original zip filename
    total_problems = Column(Integer, default=0)  # Total number of problems in zip
    processed_problems = Column(Integer, default=0)  # Number of problems processed
    total_score = Column(Integer, default=0)  # Sum of all code lengths
    status = Column(String(20), default="processing")  # processing, completed, failed
    error_message = Column(Text)  # Error details if failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    submissions = relationship("Submission", back_populates="batch_submission")

# Add batch_submission relationship to existing Submission model