"""
Batch submissions API routes for handling zip file uploads
"""

import os
import zipfile
import tempfile
import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import BatchSubmission, Submission, Problem, User
from backend.schemas import BatchSubmissionResponse, BatchSubmissionStatus
from backend.routers.users import get_current_user
from backend.code_golf_scoring import calculate_code_score

router = APIRouter()

@router.post("/upload", response_model=BatchSubmissionResponse)
async def upload_batch_submission(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a zip file containing multiple Python solutions"""
    
    # Validate file type
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="只支持ZIP文件格式 📁")
    
    # Create batch submission record
    batch_submission = BatchSubmission(
        user_id=current_user.id,
        filename=file.filename,
        status="processing"
    )
    db.add(batch_submission)
    db.commit()
    db.refresh(batch_submission)
    
    # Process zip file in background
    background_tasks.add_task(
        process_zip_file,
        batch_submission.id,
        file,
        db
    )
    
    return batch_submission

@router.get("/{batch_id}/status", response_model=BatchSubmissionStatus)
async def get_batch_status(
    batch_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the status of a batch submission"""
    
    batch = db.query(BatchSubmission).filter(
        BatchSubmission.id == batch_id,
        BatchSubmission.user_id == current_user.id
    ).first()
    
    if not batch:
        raise HTTPException(status_code=404, detail="批量提交记录未找到 ❌")
    
    return BatchSubmissionStatus(
        id=batch.id,
        status=batch.status,
        processed_problems=batch.processed_problems,
        total_problems=batch.total_problems,
        total_score=batch.total_score,
        error_message=batch.error_message
    )

@router.get("/", response_model=List[BatchSubmissionResponse])
async def get_my_batch_submissions(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's batch submissions"""
    
    batches = db.query(BatchSubmission).filter(
        BatchSubmission.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return batches

async def process_zip_file(batch_id: int, file: UploadFile, db: Session):
    """Process uploaded zip file and create submissions"""
    
    batch = db.query(BatchSubmission).filter(BatchSubmission.id == batch_id).first()
    if not batch:
        return
    
    try:
        # Create temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            # Save uploaded file
            zip_path = os.path.join(temp_dir, file.filename)
            with open(zip_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            # Extract zip file
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            # Find all Python files matching task pattern
            task_files = []
            for root, dirs, files in os.walk(temp_dir):
                for filename in files:
                    if filename.endswith('.py') and re.match(r'task\d{3}\.py', filename):
                        task_files.append(os.path.join(root, filename))
            
            batch.total_problems = len(task_files)
            db.commit()
            
            total_score = 0
            processed = 0
            
            # Process each task file
            for task_file in task_files:
                try:
                    # Extract task number from filename
                    filename = os.path.basename(task_file)
                    task_match = re.match(r'task(\d{3})\.py', filename)
                    if not task_match:
                        continue
                    
                    task_num = int(task_match.group(1))
                    task_id = f"task{task_num:03d}"
                    
                    # Find corresponding problem
                    problem = db.query(Problem).filter(Problem.task_id == task_id).first()
                    if not problem:
                        continue
                    
                    # Read code content
                    with open(task_file, 'r', encoding='utf-8') as f:
                        code_content = f.read()
                    
                    # Calculate code score using our scoring module
                    score_info = calculate_code_score(code_content, "python")
                    code_length = score_info["score"]  # Use the calculated score
                    
                    # Create submission
                    submission = Submission(
                        user_id=batch.user_id,
                        problem_id=problem.id,
                        batch_submission_id=batch.id,
                        language="python",
                        code=code_content,
                        code_length=code_length,
                        status="completed"  # For now, just mark as completed
                    )
                    db.add(submission)
                    
                    total_score += code_length
                    processed += 1
                    
                except Exception as e:
                    print(f"Error processing {task_file}: {str(e)}")
                    continue
            
            # Update batch submission
            batch.processed_problems = processed
            batch.total_score = total_score
            batch.status = "completed"
            db.commit()
            
    except Exception as e:
        # Update batch with error
        batch.status = "failed"
        batch.error_message = str(e)
        db.commit()