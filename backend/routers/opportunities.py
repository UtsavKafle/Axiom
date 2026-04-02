from fastapi import APIRouter
from db.supabase_client import supabase

router = APIRouter()


@router.get("/")
def get_opportunities():
    response = supabase.table("opportunities").select("*").order("created_at", desc=True).execute()
    return response.data
