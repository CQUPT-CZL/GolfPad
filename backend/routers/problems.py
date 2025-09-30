"""
Problems API routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import os

from backend.database import get_db
from backend.models import Problem, Submission, User
from backend.schemas import ProblemResponse, ProblemDetail, ProblemCreate, SubmissionHistory

router = APIRouter()

@router.get("", response_model=List[ProblemResponse])
async def get_problems(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    difficulty: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get list of problems with pagination and filtering"""
    query = db.query(Problem)
    
    if difficulty:
        query = query.filter(Problem.difficulty == difficulty)
    
    problems = query.offset(skip).limit(limit).all()
    return problems

@router.get("/{problem_id}", response_model=ProblemDetail)
async def get_problem(problem_id: int, db: Session = Depends(get_db)):
    """Get problem details by ID"""
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem

@router.get("/{problem_id}/submissions", response_model=List[SubmissionHistory])
async def get_problem_submissions(
    problem_id: int,
    user_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get submissions for a specific problem"""
    # Verify problem exists
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    query = db.query(Submission).filter(Submission.problem_id == problem_id)
    
    if user_id:
        query = query.filter(Submission.user_id == user_id)
    
    submissions = query.order_by(Submission.created_at.desc()).offset(skip).limit(limit).all()
    return submissions

@router.post("/", response_model=ProblemResponse)
async def create_problem(problem: ProblemCreate, db: Session = Depends(get_db)):
    """Create a new problem (admin only)"""
    # Check if problem with same task_id already exists
    existing = db.query(Problem).filter(Problem.task_id == problem.task_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Problem with this task_id already exists")
    
    db_problem = Problem(**problem.dict())
    db.add(db_problem)
    db.commit()
    db.refresh(db_problem)
    return db_problem

@router.post("/load-from-files")
async def load_problems_from_files(db: Session = Depends(get_db)):
    """Load problems from JSON files in google-code-golf-2025 directory"""
    problems_dir = "google-code-golf-2025"
    if not os.path.exists(problems_dir):
        raise HTTPException(status_code=404, detail="Problems directory not found")
    
    loaded_count = 0
    skipped_count = 0
    
    for filename in sorted(os.listdir(problems_dir)):
        if not filename.endswith('.json'):
            continue
            
        task_id = filename.replace('.json', '')
        
        # Check if problem already exists
        existing = db.query(Problem).filter(Problem.task_id == task_id).first()
        if existing:
            skipped_count += 1
            continue
        
        filepath = os.path.join(problems_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                test_data = json.load(f)
            
            # Create problem with basic info
            problem = Problem(
                task_id=task_id,
                title=f"Task {task_id.replace('task', '')}",
                description=f"Code Golf Challenge - {task_id}",
                difficulty="medium",
                test_cases=test_data
            )
            
            db.add(problem)
            loaded_count += 1
            
        except Exception as e:
            print(f"Error loading {filename}: {e}")
            continue
    
    db.commit()
    
    return {
        "message": f"Loaded {loaded_count} problems, skipped {skipped_count} existing problems",
        "loaded": loaded_count,
        "skipped": skipped_count
    }

@router.get("/{problem_id}/leaderboard")
async def get_problem_leaderboard(
    problem_id: int,
    language: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get leaderboard for a specific problem"""
    # Verify problem exists
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Get best submissions for each user
    query = db.query(
        Submission.user_id,
        User.username,
        Submission.language,
        Submission.code_length,
        Submission.created_at
    ).join(User).filter(
        Submission.problem_id == problem_id,
        Submission.status == "passed"
    )
    
    if language:
        query = query.filter(Submission.language == language)
    
    # Get the best (shortest) submission for each user
    subquery = db.query(
        Submission.user_id,
        db.func.min(Submission.code_length).label('min_length')
    ).filter(
        Submission.problem_id == problem_id,
        Submission.status == "passed"
    ).group_by(Submission.user_id).subquery()
    
    best_submissions = query.join(
        subquery,
        (Submission.user_id == subquery.c.user_id) & 
        (Submission.code_length == subquery.c.min_length)
    ).order_by(Submission.code_length.asc()).limit(limit).all()
    
    leaderboard = []
    for rank, (user_id, username, lang, code_length, submitted_at) in enumerate(best_submissions, 1):
        leaderboard.append({
            "rank": rank,
            "username": username,
            "language": lang,
            "code_length": code_length,
            "submitted_at": submitted_at
        })
    
    return leaderboard