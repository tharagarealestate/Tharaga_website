# backend/app/supabase_client.py
"""
Supabase client initialization for Tharaga backend
Provides a configured Supabase client instance for database operations
"""

from supabase import create_client, Client
from .config import Config

# Validate configuration before creating client
Config.validate()

# Initialize Supabase client with service role key
# This client has full access and bypasses Row Level Security
# Use with caution - only in trusted backend code
supabase: Client = create_client(
    Config.SUPABASE_URL,
    Config.SUPABASE_KEY
)

# Export for use in other modules
__all__ = ['supabase']


# Helper functions for common operations
def get_user_by_id(user_id: str):
    """
    Get user data by ID

    Args:
        user_id: UUID of the user

    Returns:
        User data or None if not found
    """
    response = supabase.table('users').select('*').eq('id', user_id).execute()
    return response.data[0] if response.data else None


def create_record(table: str, data: dict):
    """
    Create a new record in specified table

    Args:
        table: Name of the table
        data: Dictionary of column-value pairs

    Returns:
        Created record data
    """
    response = supabase.table(table).insert(data).execute()
    return response.data[0] if response.data else None


def update_record(table: str, record_id: str, data: dict):
    """
    Update a record by ID

    Args:
        table: Name of the table
        record_id: UUID of the record
        data: Dictionary of column-value pairs to update

    Returns:
        Updated record data
    """
    response = supabase.table(table).update(data).eq('id', record_id).execute()
    return response.data[0] if response.data else None


def delete_record(table: str, record_id: str):
    """
    Delete a record by ID

    Args:
        table: Name of the table
        record_id: UUID of the record

    Returns:
        True if successful
    """
    response = supabase.table(table).delete().eq('id', record_id).execute()
    return True


# Example usage:
#
# from app.supabase_client import supabase
#
# # Query example
# response = supabase.table('properties').select('*').eq('status', 'active').execute()
# properties = response.data
#
# # Insert example
# new_property = supabase.table('properties').insert({
#     'title': 'Beautiful Villa',
#     'price': 500000,
#     'user_id': user_id
# }).execute()
#
# # Update example
# updated = supabase.table('properties').update({
#     'price': 550000
# }).eq('id', property_id).execute()
#
# # Delete example
# supabase.table('properties').delete().eq('id', property_id).execute()
