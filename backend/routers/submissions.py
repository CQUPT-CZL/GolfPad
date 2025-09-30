"""
Submissions API routes
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database import get_db
from backend.models import Submission, Problem, User, UserStats
from backend.schemas import SubmissionCreate, SubmissionResponse, SubmissionHistory
from backend.routers.users import get_current_user
from backend.evaluation import evaluate_code

router = APIRouter()

# Support both with and without trailing slash for POST to avoid 405
@router.post("", response_model=SubmissionResponse)
@router.post("/", response_model=SubmissionResponse)
async def submit_code(
    submission: SubmissionCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit code for evaluation"""
    # Verify problem exists
    problem = db.query(Problem).filter(Problem.id == submission.problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Calculate code length
    code_length = len(submission.code)
    
    # Create submission record
    db_submission = Submission(
        user_id=current_user.id,
        problem_id=submission.problem_id,
        language=submission.language,
        code=submission.code,
        code_length=code_length,
        status="pending"
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    
    # Start evaluation in background
    background_tasks.add_task(
        evaluate_submission,
        db_submission.id,
        submission.code,
        submission.language,
        problem.test_cases
    )
    
    return db_submission

async def evaluate_submission(submission_id: int, code: str, language: str, test_cases: dict):
    """Background task to evaluate submission"""
    from backend.database import SessionLocal
    
    db = SessionLocal()
    try:
        submission = db.query(Submission).filter(Submission.id == submission_id).first()
        if not submission:
            return
        
        # Update status to running
        submission.status = "running"
        db.commit()
        
        # Evaluate code
        result = await evaluate_code(code, language, test_cases)
        
        # Update submission with results
        submission.status = result.status
        submission.result = {
            "test_results": result.test_results,
            "error_message": result.error_message
        }
        submission.execution_time = result.execution_time
        submission.memory_usage = result.memory_usage
        
        db.commit()
        
        # Update user stats if submission passed
        if result.status == "passed":
            await update_user_stats(db, submission.user_id, submission.problem_id, submission.code_length)
        
    except Exception as e:
        # Handle evaluation error
        submission = db.query(Submission).filter(Submission.id == submission_id).first()
        if submission:
            submission.status = "error"
            submission.result = {"error_message": str(e)}
            db.commit()
    finally:
        db.close()

async def update_user_stats(db: Session, user_id: int, problem_id: int, code_length: int):
    """Update user statistics after successful submission"""
    # Get user stats
    user_stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    if not user_stats:
        user_stats = UserStats(user_id=user_id)
        db.add(user_stats)
    
    # Check if this is user's first successful submission for this problem
    previous_best = db.query(Submission).filter(
        Submission.user_id == user_id,
        Submission.problem_id == problem_id,
        Submission.status == "passed"
    ).order_by(Submission.code_length.asc()).first()
    
    is_new_problem = previous_best is None
    is_better_score = previous_best and code_length < previous_best.code_length
    
    if is_new_problem:
        user_stats.problems_solved += 1
        user_stats.total_score += code_length
    elif is_better_score:
        # Update total score (subtract old best, add new best)
        user_stats.total_score = user_stats.total_score - previous_best.code_length + code_length
    
    user_stats.total_submissions += 1
    db.commit()

@router.get("", response_model=List[SubmissionResponse])
async def get_my_submissions(
    skip: int = 0,
    limit: int = 50,
    problem_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's submissions"""
    query = db.query(Submission).filter(Submission.user_id == current_user.id)
    
    if problem_id:
        query = query.filter(Submission.problem_id == problem_id)
    
    submissions = query.order_by(Submission.created_at.desc()).offset(skip).limit(limit).all()
    return submissions

@router.get("/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific submission details"""
    submission = db.query(Submission).filter(
        Submission.id == submission_id,
        Submission.user_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return submission

@router.get("/{submission_id}/status")
async def get_submission_status(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get submission evaluation status"""
    submission = db.query(Submission).filter(
        Submission.id == submission_id,
        Submission.user_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return {
        "id": submission.id,
        "status": submission.status,
        "result": submission.result,
        "execution_time": submission.execution_time,
        "memory_usage": submission.memory_usage
    }