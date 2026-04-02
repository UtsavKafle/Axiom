from fastapi import APIRouter
from db.supabase_client import supabase

router = APIRouter()


@router.get("/{user_id}")
def get_resume_feedback(user_id: str):
    response = supabase.table("resume_reviews").select("*").eq("user_id", user_id).execute()
    return response.data
