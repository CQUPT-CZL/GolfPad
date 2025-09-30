"""
Users API routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os

from backend.database import get_db
from backend.models import User, UserStats
from backend.schemas import UserCreate, UserResponse, UserLogin, UserStatsResponse, UserScoresResponse, UserProblemScore

router = APIRouter()
security = HTTPBearer()

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password, stored_password):
    return plain_password == stored_password

def get_password_hash(password):
    return password  # 直接返回明文密码

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create user stats
    user_stats = UserStats(user_id=db_user.id)
    db.add(user_stats)
    db.commit()
    
    return db_user

@router.post("/login")
async def login_user(user_login: UserLogin, db: Session = Depends(get_db)):
    """Login user and return access token"""
    user = db.query(User).filter(User.username == user_login.username).first()
    if not user or not verify_password(user_login.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@router.get("/{user_id}/stats", response_model=UserStatsResponse)
async def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    """Get user statistics"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    if not stats:
        # Create default stats if not exists
        stats = UserStats(user_id=user_id)
        db.add(stats)
        db.commit()
        db.refresh(stats)
    
    return {
        "user_id": user.id,
        "username": user.username,
        "total_score": stats.total_score,
        "problems_solved": stats.problems_solved,
        "total_submissions": stats.total_submissions,
        "rank": stats.rank
    }

@router.get("/me/stats", response_model=UserStatsResponse)
async def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's statistics"""
    print(f"[users.me.stats] start user_id={current_user.id} username={current_user.username}")
    stats = db.query(UserStats).filter(UserStats.user_id == current_user.id).first()
    if not stats:
        stats = UserStats(user_id=current_user.id)
        db.add(stats)
        db.commit()
        db.refresh(stats)
        print(f"[users.me.stats] created default stats for user_id={current_user.id}")
    
    print(f"[users.me.stats] total_score={stats.total_score or 0}, "
          f"problems_solved={stats.problems_solved or 0}, "
          f"total_submissions={stats.total_submissions or 0}, "
          f"rank={stats.rank}")
    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "total_score": stats.total_score or 0,
        "problems_solved": stats.problems_solved or 0,
        "total_submissions": stats.total_submissions or 0,
        "rank": stats.rank
    }

@router.get("/me/scores", response_model=UserScoresResponse)
async def get_my_scores(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compute per-problem scores for current user.
    Rule: score = 2500 - best passed code length; if no passed, 0.001."""
    from sqlalchemy import func
    from backend.models import Submission, Problem
    print(f"[users.me.scores] start user_id={current_user.id} username={current_user.username}")
    problems = db.query(Problem).all()
    print(f"[users.me.scores] problems_count={len(problems)}")

    best_lengths = db.query(
        Submission.problem_id,
        func.min(Submission.code_length).label('min_length')
    ).filter(
        Submission.user_id == current_user.id,
        Submission.status == "passed"
    ).group_by(Submission.problem_id).all()
    print(f"[users.me.scores] best_lengths_raw={best_lengths}")
    best_map = {pid: length for pid, length in best_lengths}
    print(f"[users.me.scores] best_map={best_map}")

    items: list[UserProblemScore] = []
    total = 0.0
    for p in problems:
        min_len = best_map.get(p.id)
        score = float(2500 - min_len) if min_len is not None else 0.001
        # Round to 3 decimal places to avoid floating point noise
        score = round(score, 3)
        total += score
        print(f"[users.me.scores] problem_id={p.id} title={p.title!r} "
              f"min_len={min_len} score={score}")
        items.append(UserProblemScore(
            problem_id=p.id,
            task_id=p.task_id,
            title=p.title,
            code_length=min_len,
            score=score
        ))
    # Round total as well for consistency
    total = round(total, 3)
    print(f"[users.me.scores] total_score={total}")
    return UserScoresResponse(total_score=total, items=items)