from fastapi import APIRouter
from db.supabase_client import supabase

router = APIRouter()


@router.get("/")
def get_news():
    response = supabase.table("news").select("*").order("created_at", desc=True).execute()
    return response.data
