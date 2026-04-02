from fastapi import APIRouter
from db.supabase_client import supabase

router = APIRouter()


@router.get("/")
def get_interview_prep():
    response = supabase.table("interview_questions").select("*").execute()
    return response.data
