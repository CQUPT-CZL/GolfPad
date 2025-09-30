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

def wrap_user_code(code: str, language: str) -> str:
    """
    Wrap user code with test execution logic
    """
    print(f"🔧 Wrapping user code for language: {language}")
    print(f"📝 Original code length: {len(code)} characters")
    
    if language == "python":
        wrapped = f"""
import json
import sys

# User's code
{code}

# Test execution wrapper
if __name__ == "__main__":
    try:
        # Read input from stdin
        input_data = sys.stdin.read().strip()
        print(f"📥 Received input data: {{input_data}}", file=sys.stderr)
        
        if input_data:
            test_input = json.loads(input_data)
            print(f"✅ Parsed input as JSON: {{test_input}}", file=sys.stderr)
        else:
            test_input = None
            print("ℹ️ No input data provided", file=sys.stderr)
        
        # Find the main function (assume it's the first function defined)
        import inspect
        import types
        
        # Get all functions from the current module
        current_module = sys.modules[__name__]
        functions = []
        for name, obj in inspect.getmembers(current_module):
            if inspect.isfunction(obj) and not name.startswith('_'):
                functions.append((name, obj))
        
        print(f"🔍 Found {{len(functions)}} functions: {{[f[0] for f in functions]}}", file=sys.stderr)
        
        if not functions:
            print("❌ No function found in code", file=sys.stderr)
            print(json.dumps({{"error": "No function found in code"}}))
            sys.exit(1)
        
        # Use the first function found
        func_name, func = functions[0]
        print(f"🎯 Using function: {{func_name}}", file=sys.stderr)
        
        # Call the function with test input
        if test_input is not None:
            print(f"📋 Calling {{func_name}} with single arg: {{test_input}}", file=sys.stderr)
            result = func(test_input)
        else:
            print(f"📋 Calling {{func_name}} with no args", file=sys.stderr)
            result = func()
        
        print(f"✅ Function returned: {{result}}", file=sys.stderr)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        print(f"❌ Exception occurred: {{str(e)}}", file=sys.stderr)
        print(json.dumps({{"error": str(e)}}))
        sys.exit(1)
"""
        print(f"✅ Wrapped code length: {len(wrapped)} characters")
        return wrapped
    else:
        # For other languages, return code as-is for now
        print(f"⚠️ Language {language} not yet supported for wrapping, returning original code")
        return code


async def evaluate_code(code: str, language: str, test_cases: Dict[str, Any]) -> EvaluationResult:
    """
    Evaluate code against test cases
    """
    print(f"\n🚀 Starting code evaluation")
    print(f"📝 Language: {language}")
    print(f"📊 Test cases keys: {list(test_cases.keys())}")
    print(f"💻 Code preview: {code[:100]}...")
    
    if language not in LANGUAGE_CONFIG:
        print(f"❌ Unsupported language: {language}")
        return EvaluationResult(
            status="error",
            test_results=[],
            error_message=f"Unsupported language: {language}"
        )
    
    config = LANGUAGE_CONFIG[language]
    print(f"⚙️ Using config: {config}")
    
    try:
        # Create temporary directory for execution
        with tempfile.TemporaryDirectory() as temp_dir:
            print(f"📁 Created temp directory: {temp_dir}")
            
            # Wrap user code with test execution logic
            wrapped_code = wrap_user_code(code, language)
            
            # Write wrapped code to file
            source_file = os.path.join(temp_dir, f"solution{config['extension']}")
            with open(source_file, 'w', encoding='utf-8') as f:
                f.write(wrapped_code)
            print(f"💾 Wrote code to: {source_file}")
            
            # Compile if necessary
            executable = None
            if "compile_command" in config:
                print(f"🔨 Compiling code...")
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
                
                print(f"🔨 Compile command: {' '.join(compile_cmd)}")
                
                # Compile
                compile_result = await run_command(compile_cmd, timeout=30)
                if compile_result["returncode"] != 0:
                    print(f"❌ Compilation failed: {compile_result['stderr']}")
                    return EvaluationResult(
                        status="error",
                        test_results=[],
                        error_message=f"Compilation failed: {compile_result['stderr']}"
                    )
                print(f"✅ Compilation successful")
            
            # Run tests
            test_results = []
            total_time = 0
            max_memory = 0
            passed_total = 0
            
            # 遍历所有类型的测试用例（train, test, arc-gen等）
            for test_type, test_case_list in test_cases.items():
                if not isinstance(test_case_list, list):
                    print(f"⚠️ Skipping {test_type}: not a list of test cases")
                    continue
                    
                print(f"🏃 Running {len(test_case_list)} {test_type} test cases...")
                
                for i, test_case in enumerate(test_case_list):
                    print(f"🧪 Running {test_type} test case {i}: {test_case}")
                    result = await run_test_case(
                        source_file, executable, config, test_case, f"{test_type}_{i}"
                    )
                    print(f"📊 Test result: {result}")
                    
                    if result["status"] != "passed":
                        print(f"❌ {test_type} test case {i} failed, stopping evaluation")
                        # 在失败时保留详细的失败结果，便于排查
                        test_results.append(result)
                        return EvaluationResult(
                            status="failed",
                            test_results=test_results,
                            execution_time=total_time,
                            memory_usage=max_memory
                        )
                    
                    total_time += result.get("execution_time", 0)
                    max_memory = max(max_memory, result.get("memory_usage", 0))
                    passed_total += 1
                
                print(f"✅ All {test_type} test cases passed")
            
            print(f"🎉 Evaluation completed successfully!")
            print(f"⏱️ Total execution time: {total_time:.3f}s")
            print(f"💾 Max memory usage: {max_memory} bytes")
            
            # 通过时仅返回“通过”二字，避免出现 summary 或分隔符
            return EvaluationResult(
                status="passed",
                test_results=[{"message": "通过"}],
                execution_time=total_time,
                memory_usage=max_memory
            )
            
    except Exception as e:
        print(f"❌ Evaluation error: {str(e)}")
        return EvaluationResult(
            status="error",
            test_results=[],
            error_message=str(e)
        )

async def run_test_case(source_file: str, executable: str, config: Dict, test_case: Dict, test_name: str) -> Dict[str, Any]:
    """
    Run a single test case
    """
    print(f"\n🧪 Running test case: {test_name}")
    
    try:
        # Prepare input
        input_data = json.dumps(test_case["input"])
        expected_output = test_case["output"]
        print(f"📥 Input data: {input_data}")
        print(f"🎯 Expected output: {expected_output}")
        
        # Prepare command
        if executable:
            print(f"🔧 Using executable: {executable}")
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
        
        print(f"🚀 Command: {' '.join(cmd)}")
        
        # Run the code
        start_time = time.time()
        result = await run_command(
            cmd,
            input_data=input_data,
            timeout=config["timeout"]
        )
        execution_time = time.time() - start_time
        
        print(f"⏱️ Execution time: {execution_time:.3f}s")
        print(f"🔢 Return code: {result['returncode']}")
        print(f"📤 Stdout: {result['stdout'][:200]}...")
        print(f"📤 Stderr: {result['stderr'][:200]}...")
        
        if result["returncode"] != 0:
            print(f"❌ Command failed with return code {result['returncode']}")
            return {
                "test_name": test_name,
                "status": "failed",
                "error": result["stderr"],
                "execution_time": execution_time
            }
        
        # Parse output
        try:
            stdout_clean = result["stdout"].strip()
            print(f"🧹 Cleaned stdout: {stdout_clean}")
            
            if not stdout_clean:
                print(f"❌ No output produced")
                return {
                    "test_name": test_name,
                    "status": "failed",
                    "error": "No output produced",
                    "execution_time": execution_time
                }
            
            # Try to parse as JSON first
            try:
                actual_output = json.loads(stdout_clean)
                print(f"✅ Parsed as JSON: {actual_output}")
            except json.JSONDecodeError:
                print(f"⚠️ JSON parsing failed, trying ast.literal_eval...")
                # If JSON parsing fails, try to evaluate the output as Python literal
                try:
                    import ast
                    actual_output = ast.literal_eval(stdout_clean)
                    print(f"✅ Parsed as Python literal: {actual_output}")
                except (ValueError, SyntaxError):
                    # If both fail, treat as string output
                    actual_output = stdout_clean
                    print(f"⚠️ Treating as string: {actual_output}")
                    
        except Exception as e:
            print(f"❌ Output parsing error: {str(e)}")
            return {
                "test_name": test_name,
                "status": "failed",
                "error": f"Output parsing error: {str(e)}. Raw output: {result['stdout'][:200]}",
                "execution_time": execution_time
            }
        
        # Compare outputs
        print(f"🔍 Comparing outputs:")
        print(f"   Expected: {expected_output} (type: {type(expected_output)})")
        print(f"   Actual:   {actual_output} (type: {type(actual_output)})")
        
        if actual_output == expected_output:
            print(f"✅ Test case passed!")
            return {
                "test_name": test_name,
                "status": "passed",
                "execution_time": execution_time,
                "memory_usage": result.get("memory_usage", 0)
            }
        else:
            print(f"❌ Test case failed - outputs don't match")
            return {
                "test_name": test_name,
                "status": "failed",
                "expected": expected_output,
                "actual": actual_output,
                "execution_time": execution_time
            }
            
    except Exception as e:
        print(f"❌ Test case error: {str(e)}")
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
        # On macOS, preexec_fn can cause issues with asyncio, so we'll skip resource limits for now
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdin=asyncio.subprocess.PIPE if input_data else None,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
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