import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWorkout } from '@/lib/openai';
import { WorkoutGenerationRequest } from '@/types/workout';
import { findOrCreateExercise, linkExerciseToWorkout, calculateWorkoutSummary } from '@/lib/exercises/database';

// Rate limit: 100 generations per day per user
const RATE_LIMIT = 100;
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check rate limit
    const now = new Date();
    const yesterday = new Date(now.getTime() - RATE_LIMIT_WINDOW);
    
    const { count } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', yesterday.toISOString());
    
    if (count && count >= RATE_LIMIT) {
      return NextResponse.json(
        { error: `Rate limit exceeded. You can generate up to ${RATE_LIMIT} workouts per day.` },
        { status: 429 }
      );
    }
    
    // Parse request body
    const requestData: WorkoutGenerationRequest = await request.json();
    
    // Validate request
    if (!requestData.muscleFocus || requestData.muscleFocus.length === 0) {
      return NextResponse.json(
        { error: 'At least one muscle group must be selected' },
        { status: 400 }
      );
    }
    
    if (!requestData.workoutFocus || requestData.workoutFocus.length === 0) {
      return NextResponse.json(
        { error: 'At least one workout focus must be selected' },
        { status: 400 }
      );
    }
    
    // Generate workout
    console.log('Generating workout with parameters:', requestData);
    const result = await generateWorkout(requestData);
    
    if (!result.success || !result.data) {
      console.error('Failed to generate workout:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to generate workout' },
        { status: 500 }
      );
    }
    
    console.log('Workout generated successfully');
    
    try {
      // Create workout in database
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          name: result.data.name,
          description: result.data.description,
          duration_minutes: result.data.total_duration_minutes,
          focus: requestData.workoutFocus,
          difficulty: requestData.difficulty,
          equipment_required: result.data.equipment_required || [],
          muscle_groups: requestData.muscleFocus
        })
        .select()
        .single();
      
      if (workoutError) {
        console.error('Error creating workout:', workoutError);
        return NextResponse.json(
          { error: 'Failed to save workout to database' },
          { status: 500 }
        );
      }
      
      console.log(`Workout created with ID: ${workout.id}`);
      
      // Process exercises
      const exercisePromises = [];
      
      try {
        // Process each exercise
        for (let index = 0; index < result.data.exercises.length; index++) {
          const exerciseData = result.data.exercises[index];
          // Convert rest_time_seconds to rest_seconds for database consistency
          const rest_seconds = exerciseData.rest_time_seconds;
          
          // Create or find the exercise in the database
          const { exercise, created } = await findOrCreateExercise({
            name: exerciseData.name,
            primary_muscles: exerciseData.primary_muscles || [],
            secondary_muscles: exerciseData.secondary_muscles,
            equipment: exerciseData.equipment
            // movement_type is defined in the type but not used in the database function
          });
          
          console.log(`${created ? 'Created' : 'Found'} exercise: ${exercise.name} (${exercise.id})`);
          
          // Sanitize and limit the rationale field
          let sanitizedRationale: string | undefined = undefined;
          console.log('Original rationale:', exerciseData.rationale);
          
          try {
            if (exerciseData.rationale) {
              // Limit rationale to 1000 characters
              sanitizedRationale = exerciseData.rationale.substring(0, 1000);
            }
          } catch (e) {
            console.error('Error processing rationale:', e);
          }
          
          // Link exercise to workout
          const promise = linkExerciseToWorkout({
            workout_id: workout.id,
            exercise_id: exercise.id,
            order_index: index,
            sets: exerciseData.sets,
            reps: exerciseData.reps,
            weight: exerciseData.weight,
            rest_seconds: rest_seconds,
            duration_seconds: exerciseData.duration_seconds,
            notes: exerciseData.notes,
            rationale: sanitizedRationale
          });
          
          exercisePromises.push(promise);
        }
        
        // Wait for all exercise links to be created
        await Promise.all(exercisePromises);
        console.log('All exercises linked to workout');
        
        // Calculate workout summary
        await calculateWorkoutSummary(workout.id);
        
        // Return the workout with exercises
        return NextResponse.json({
          success: true,
          workout: {
            ...workout,
            exercises: result.data.exercises
          }
        });
      } catch (exerciseError) {
        console.error('Error processing exercises:', exerciseError);
        
        // Delete the workout if exercise processing failed
        await supabase
          .from('workouts')
          .delete()
          .eq('id', workout.id);
        
        return NextResponse.json(
          { error: 'Failed to process exercises' },
          { status: 500 }
        );
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save workout to database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating workout:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
