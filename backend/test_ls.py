import asyncio
from langsmith import traceable, get_current_run_tree

@traceable
async def my_func(session_id: str):
    rt = get_current_run_tree()
    rt.extra.setdefault("metadata", {})["session_id"] = session_id
    # or rt.add_metadata({"session_id": session_id})? 
    try:
        # Check if add_metadata exists
        rt.add_metadata({"session_id": session_id})
        print("add_metadata worked!")
    except Exception as e:
        print("add_metadata failed:", e)

asyncio.run(my_func("123"))
