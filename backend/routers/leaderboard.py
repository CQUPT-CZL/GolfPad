"""
Leaderboard API routes
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from backend.database import get_db
from backend.models import User, UserStats, Submission, Problem
from backend.schemas import LeaderboardEntry, ProblemLeaderboardEntry

router = APIRouter()

@router.get("/global", response_model=List[LeaderboardEntry])
async def get_global_leaderboard(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get global leaderboard based on total scores"""
    # Get users with their stats, ordered by total score (ascending for golf scoring)
    leaderboard_data = db.query(
        User.username,
        UserStats.total_score,
        UserStats.problems_solved
    ).join(UserStats).filter(
        UserStats.problems_solved > 0  # Only users who solved at least one problem
    ).order_by(
        UserStats.total_score.asc(),  # Lower score is better in code golf
        UserStats.problems_solved.desc()  # More problems solved as tiebreaker
    ).limit(limit).all()
    
    leaderboard = []
    for rank, (username, total_score, problems_solved) in enumerate(leaderboard_data, 1):
        leaderboard.append(LeaderboardEntry(
            rank=rank,
            username=username,
            total_score=total_score,
            problems_solved=problems_solved
        ))
    
    return leaderboard

@router.get("/problem/{problem_id}", response_model=List[ProblemLeaderboardEntry])
async def get_problem_leaderboard(
    problem_id: int,
    language: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get leaderboard for a specific problem"""
    # Verify problem exists
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Base query for successful submissions
    query = db.query(
        User.username,
        Submission.language,
        Submission.code_length,
        Submission.created_at
    ).join(User).filter(
        Submission.problem_id == problem_id,
        Submission.status == "passed"
    )
    
    # Filter by language if specified
    if language:
        query = query.filter(Submission.language == language)
    
    # Get the best (shortest) submission for each user
    # First, get the minimum code length for each user
    subquery = db.query(
        Submission.user_id,
        func.min(Submission.code_length).label('min_length')
    ).filter(
        Submission.problem_id == problem_id,
        Submission.status == "passed"
    )
    
    if language:
        subquery = subquery.filter(Submission.language == language)
    
    subquery = subquery.group_by(Submission.user_id).subquery()
    
    # Join with the subquery to get the best submissions
    best_submissions = query.join(
        subquery,
        (Submission.user_id == subquery.c.user_id) & 
        (Submission.code_length == subquery.c.min_length)
    ).order_by(
        Submission.code_length.asc(),
        Submission.created_at.asc()  # Earlier submission wins in case of tie
    ).limit(limit).all()
    
    leaderboard = []
    for rank, (username, lang, code_length, submitted_at) in enumerate(best_submissions, 1):
        leaderboard.append(ProblemLeaderboardEntry(
            rank=rank,
            username=username,
            code_length=code_length,
            language=lang,
            submitted_at=submitted_at
        ))
    
    return leaderboard

@router.get("/languages/{language}", response_model=List[LeaderboardEntry])
async def get_language_leaderboard(
    language: str,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get leaderboard for a specific programming language"""
    # Get best submissions for each user in the specified language
    user_best_scores = db.query(
        Submission.user_id,
        func.sum(
            db.query(func.min(Submission.code_length))
            .filter(
                Submission.user_id == Submission.user_id,
                Submission.language == language,
                Submission.status == "passed"
            )
            .group_by(Submission.problem_id)
            .subquery().c.min
        ).label('total_score'),
        func.count(func.distinct(Submission.problem_id)).label('problems_solved')
    ).filter(
        Submission.language == language,
        Submission.status == "passed"
    ).group_by(Submission.user_id).subquery()
    
    # Join with user information
    leaderboard_data = db.query(
        User.username,
        user_best_scores.c.total_score,
        user_best_scores.c.problems_solved
    ).join(
        user_best_scores,
        User.id == user_best_scores.c.user_id
    ).order_by(
        user_best_scores.c.total_score.asc(),
        user_best_scores.c.problems_solved.desc()
    ).limit(limit).all()
    
    leaderboard = []
    for rank, (username, total_score, problems_solved) in enumerate(leaderboard_data, 1):
        leaderboard.append(LeaderboardEntry(
            rank=rank,
            username=username,
            total_score=total_score or 0,
            problems_solved=problems_solved or 0
        ))
    
    return leaderboard

@router.post("/update-ranks")
async def update_user_ranks(db: Session = Depends(get_db)):
    """Update user rankings (admin function)"""
    # Get all users with their total scores
    users_with_scores = db.query(
        UserStats.user_id,
        UserStats.total_score,
        UserStats.problems_solved
    ).filter(
        UserStats.problems_solved > 0
    ).order_by(
        UserStats.total_score.asc(),
        UserStats.problems_solved.desc()
    ).all()
    
    # Update ranks
    for rank, (user_id, total_score, problems_solved) in enumerate(users_with_scores, 1):
        user_stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
        if user_stats:
            user_stats.rank = rank
    
    db.commit()
    
    return {
        "message": f"Updated ranks for {len(users_with_scores)} users",
        "updated_count": len(users_with_scores)
    }