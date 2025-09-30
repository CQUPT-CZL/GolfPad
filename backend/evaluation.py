"""
Code evaluation system for different programming languages
"""

import asyncio
import subprocess
import tempfile
import os
import json
import time
import resource
from typing import Dict, Any, List
from backend.schemas import EvaluationResult

# Supported languages and their configurations
LANGUAGE_CONFIG = {
    "python": {
        "extension": ".py",
        "command": ["python3"],
        "timeout": 10
    },
    "javascript": {
        "extension": ".js",
        "command": ["node"],
        "timeout": 10
    },
    "cpp": {
        "extension": ".cpp",
        "compile_command": ["g++", "-o", "{output}", "{source}", "-std=c++17"],
        "run_command": ["{output}"],
        "timeout": 10
    },
    "java": {
        "extension": ".java",
        "compile_command": ["javac", "{source}"],
        "run_command": ["java", "-cp", "{dir}", "{classname}"],
        "timeout": 15
    },
    "go": {
        "extension": ".go",
        "command": ["go", "run"],
        "timeout": 10
    },
    "rust": {
        "extension": ".rs",
        "compile_command": ["rustc", "{source}", "-o", "{output}"],
        "run_command": ["{output}"],
        "timeout": 15
    }
}

async def evaluate_code(code: str, language: str, test_cases: Dict[str, Any]) -> EvaluationResult:
    """
    Evaluate code against test cases
    """
    if language not in LANGUAGE_CONFIG:
        return EvaluationResult(
            status="error",
            test_results=[],
            error_message=f"Unsupported language: {language}"
        )
    
    config = LANGUAGE_CONFIG[language]
    
    try:
        # Create temporary directory for execution
        with tempfile.TemporaryDirectory() as temp_dir:
            # Write code to file
            source_file = os.path.join(temp_dir, f"solution{config['extension']}")
            with open(source_file, 'w', encoding='utf-8') as f:
                f.write(code)
            
            # Compile if necessary
            executable = None
            if "compile_command" in config:
                executable = os.path.join(temp_dir, "solution")
                compile_cmd = []
                for part in config["compile_command"]:
                    if "{source}" in part:
                        compile_cmd.append(part.replace("{source}", source_file))
                    elif "{output}" in part:
                        compile_cmd.append(part.replace("{output}", executable))
                    elif "{dir}" in part:
                        compile_cmd.append(part.replace("{dir}", temp_dir))
                    else:
                        compile_cmd.append(part)
                
                # Compile
                compile_result = await run_command(compile_cmd, timeout=30)
                if compile_result["returncode"] != 0:
                    return EvaluationResult(
                        status="error",
                        test_results=[],
                        error_message=f"Compilation failed: {compile_result['stderr']}"
                    )
            
            # Run tests
            test_results = []
            total_time = 0
            max_memory = 0
            
            # Test on training data
            if "train" in test_cases:
                for i, test_case in enumerate(test_cases["train"]):
                    result = await run_test_case(
                        source_file, executable, config, test_case, f"train_{i}"
                    )
                    test_results.append(result)
                    
                    if result["status"] != "passed":
                        return EvaluationResult(
                            status="failed",
                            test_results=test_results,
                            execution_time=total_time,
                            memory_usage=max_memory
                        )
                    
                    total_time += result.get("execution_time", 0)
                    max_memory = max(max_memory, result.get("memory_usage", 0))
            
            # Test on test data
            if "test" in test_cases:
                for i, test_case in enumerate(test_cases["test"]):
                    result = await run_test_case(
                        source_file, executable, config, test_case, f"test_{i}"
                    )
                    test_results.append(result)
                    
                    if result["status"] != "passed":
                        return EvaluationResult(
                            status="failed",
                            test_results=test_results,
                            execution_time=total_time,
                            memory_usage=max_memory
                        )
                    
                    total_time += result.get("execution_time", 0)
                    max_memory = max(max_memory, result.get("memory_usage", 0))
            
            return EvaluationResult(
                status="passed",
                test_results=test_results,
                execution_time=total_time,
                memory_usage=max_memory
            )
            
    except Exception as e:
        return EvaluationResult(
            status="error",
            test_results=[],
            error_message=str(e)
        )

async def run_test_case(source_file: str, executable: str, config: Dict, test_case: Dict, test_name: str) -> Dict[str, Any]:
    """
    Run a single test case
    """
    try:
        # Prepare input
        input_data = json.dumps(test_case["input"])
        expected_output = test_case["output"]
        
        # Prepare command
        if executable:
            # Compiled language
            if "run_command" in config:
                cmd = []
                for part in config["run_command"]:
                    if "{output}" in part:
                        cmd.append(part.replace("{output}", executable))
                    elif "{dir}" in part:
                        cmd.append(part.replace("{dir}", os.path.dirname(source_file)))
                    elif "{classname}" in part:
                        # For Java
                        cmd.append("solution")
                    else:
                        cmd.append(part)
            else:
                cmd = [executable]
        else:
            # Interpreted language
            cmd = config["command"] + [source_file]
        
        # Run the code
        start_time = time.time()
        result = await run_command(
            cmd,
            input_data=input_data,
            timeout=config["timeout"]
        )
        execution_time = time.time() - start_time
        
        if result["returncode"] != 0:
            return {
                "test_name": test_name,
                "status": "failed",
                "error": result["stderr"],
                "execution_time": execution_time
            }
        
        # Parse output
        try:
            actual_output = json.loads(result["stdout"].strip())
        except json.JSONDecodeError:
            return {
                "test_name": test_name,
                "status": "failed",
                "error": f"Invalid JSON output: {result['stdout']}",
                "execution_time": execution_time
            }
        
        # Compare outputs
        if actual_output == expected_output:
            return {
                "test_name": test_name,
                "status": "passed",
                "execution_time": execution_time,
                "memory_usage": result.get("memory_usage", 0)
            }
        else:
            return {
                "test_name": test_name,
                "status": "failed",
                "expected": expected_output,
                "actual": actual_output,
                "execution_time": execution_time
            }
            
    except Exception as e:
        return {
            "test_name": test_name,
            "status": "error",
            "error": str(e)
        }

async def run_command(cmd: List[str], input_data: str = None, timeout: int = 10) -> Dict[str, Any]:
    """
    Run a command with timeout and resource limits
    """
    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdin=asyncio.subprocess.PIPE if input_data else None,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            preexec_fn=set_limits
        )
        
        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(input=input_data.encode() if input_data else None),
                timeout=timeout
            )
            
            return {
                "returncode": process.returncode,
                "stdout": stdout.decode('utf-8', errors='replace'),
                "stderr": stderr.decode('utf-8', errors='replace'),
                "memory_usage": 0  # TODO: Implement memory usage tracking
            }
            
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            return {
                "returncode": -1,
                "stdout": "",
                "stderr": "Execution timeout",
                "memory_usage": 0
            }
            
    except Exception as e:
        return {
            "returncode": -1,
            "stdout": "",
            "stderr": str(e),
            "memory_usage": 0
        }

def set_limits():
    """
    Set resource limits for the subprocess
    """
    # Limit memory to 256MB
    resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024, 256 * 1024 * 1024))
    
    # Limit CPU time to 30 seconds
    resource.setrlimit(resource.RLIMIT_CPU, (30, 30))
    
    # Limit number of processes
    resource.setrlimit(resource.RLIMIT_NPROC, (10, 10))