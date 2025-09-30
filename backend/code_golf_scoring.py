"""
Code Golf Scoring Module
Based on Google Code Golf 2025 competition rules
"""

import os
import tempfile
from typing import Dict, Any, Optional

def calculate_code_score(code: str, language: str = "python") -> Dict[str, Any]:
    """
    Calculate the score for a code golf submission
    
    Args:
        code: The source code as string
        language: Programming language (default: python)
    
    Returns:
        Dictionary containing score information
    """
    
    # For code golf, the score is typically the byte length of the source code
    if language.lower() == "python":
        # Calculate byte length (UTF-8 encoding)
        byte_length = len(code.encode('utf-8'))
        
        # Calculate character length
        char_length = len(code)
        
        # Remove trailing whitespace and count lines
        lines = code.strip().split('\n')
        line_count = len(lines)
        
        # Calculate effective code (excluding comments and empty lines)
        effective_lines = []
        for line in lines:
            stripped = line.strip()
            if stripped and not stripped.startswith('#'):
                effective_lines.append(stripped)
        
        effective_code = '\n'.join(effective_lines)
        effective_byte_length = len(effective_code.encode('utf-8'))
        
        return {
            "byte_length": byte_length,
            "char_length": char_length,
            "line_count": line_count,
            "effective_byte_length": effective_byte_length,
            "score": byte_length,  # Primary score is byte length
            "language": language,
            "scoring_method": "byte_length"
        }
    
    else:
        # For other languages, use byte length as well
        byte_length = len(code.encode('utf-8'))
        return {
            "byte_length": byte_length,
            "char_length": len(code),
            "score": byte_length,
            "language": language,
            "scoring_method": "byte_length"
        }

def calculate_file_score(file_path: str) -> Dict[str, Any]:
    """
    Calculate score for a code file (similar to code_golf_utils.py)
    
    Args:
        file_path: Path to the code file
    
    Returns:
        Dictionary containing score information
    """
    
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    # Get file size in bytes (like os.path.getsize in the reference code)
    file_size = os.path.getsize(file_path)
    
    # Read file content for additional analysis
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        # If UTF-8 fails, try with other encodings
        with open(file_path, 'r', encoding='latin-1') as f:
            content = f.read()
    
    # Determine language from file extension
    _, ext = os.path.splitext(file_path)
    language_map = {
        '.py': 'python',
        '.js': 'javascript',
        '.cpp': 'cpp',
        '.c': 'c',
        '.java': 'java',
        '.go': 'go',
        '.rs': 'rust'
    }
    language = language_map.get(ext.lower(), 'unknown')
    
    # Calculate detailed score
    score_info = calculate_code_score(content, language)
    
    # Add file-specific information
    score_info.update({
        "file_path": file_path,
        "file_size_bytes": file_size,
        "file_extension": ext
    })
    
    return score_info

def validate_submission_format(code: str, language: str = "python") -> Dict[str, Any]:
    """
    Validate that the submission follows proper format
    
    Args:
        code: The source code
        language: Programming language
    
    Returns:
        Validation result dictionary
    """
    
    issues = []
    warnings = []
    
    if language.lower() == "python":
        # Check for basic Python syntax issues
        if not code.strip():
            issues.append("代码不能为空")
        
        # Check for common issues
        if code.count('"""') % 2 != 0 or code.count("'''") % 2 != 0:
            issues.append("多行字符串引号不匹配")
        
        # Check for excessive whitespace
        lines = code.split('\n')
        trailing_empty_lines = 0
        for line in reversed(lines):
            if line.strip() == '':
                trailing_empty_lines += 1
            else:
                break
        
        if trailing_empty_lines > 2:
            warnings.append(f"代码末尾有 {trailing_empty_lines} 行空行，可以优化")
        
        # Check for tabs vs spaces
        has_tabs = '\t' in code
        has_spaces = '    ' in code or '  ' in code
        
        if has_tabs and has_spaces:
            warnings.append("混合使用了制表符和空格，建议统一")
    
    return {
        "is_valid": len(issues) == 0,
        "issues": issues,
        "warnings": warnings,
        "can_submit": len(issues) == 0
    }

def compare_submissions(code1: str, code2: str, language: str = "python") -> Dict[str, Any]:
    """
    Compare two code submissions
    
    Args:
        code1: First code submission
        code2: Second code submission  
        language: Programming language
    
    Returns:
        Comparison result
    """
    
    score1 = calculate_code_score(code1, language)
    score2 = calculate_code_score(code2, language)
    
    improvement = score1["score"] - score2["score"]
    improvement_percent = (improvement / score1["score"]) * 100 if score1["score"] > 0 else 0
    
    return {
        "code1_score": score1["score"],
        "code2_score": score2["score"],
        "improvement": improvement,
        "improvement_percent": improvement_percent,
        "better_submission": 1 if score1["score"] < score2["score"] else 2,
        "score1_details": score1,
        "score2_details": score2
    }