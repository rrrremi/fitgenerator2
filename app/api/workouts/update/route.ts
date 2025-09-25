import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function PUT(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { id, name } = body;
    
    // Validate inputs
    if (!id) {
      return NextResponse.json({ error: 'Workout ID is required' }, { status: 400 });
    }
    
    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== 'string') {
        return NextResponse.json({ error: 'Name must be a string' }, { status: 400 });
      }
      
      const trimmedName = name.trim();
      
      if (trimmedName.length > 50) {
        return NextResponse.json({ error: 'Name cannot exceed 50 characters' }, { status: 400 });
      }
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if workout exists and belongs to user
    const { data: existingWorkout, error: fetchError } = await supabase
      .from('workouts')
      .select('id, user_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingWorkout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }
    
    if (existingWorkout.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Update the workout
    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name.trim() || null; // Store null if empty string
    }
    
    const { data: updatedWorkout, error: updateError } = await supabase
      .from('workouts')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('Error updating workout:', updateError);
      return NextResponse.json({ error: 'Failed to update workout' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      workout: updatedWorkout
    });
    
  } catch (error) {
    console.error('Error in workout update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
