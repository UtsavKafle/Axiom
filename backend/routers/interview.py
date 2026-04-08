from fastapi import APIRouter
from db.supabase_client import supabase

router = APIRouter()


@router.get("/questions")
def get_questions():
    response = supabase.table("questions").select("*").order("created_at", desc=False).execute()
    return response.data
