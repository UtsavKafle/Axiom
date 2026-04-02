from fastapi import APIRouter
from db.supabase_client import supabase

router = APIRouter()


@router.get("/{user_id}")
def get_roadmap(user_id: str):
    response = supabase.table("roadmaps").select("*").eq("user_id", user_id).execute()
    return response.data
