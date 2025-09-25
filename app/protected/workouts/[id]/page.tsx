'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Dumbbell, Sparkles, Play, Target, BarChart3, Clock, Calendar, Trash2, ArrowLeft, RefreshCw, Info, Zap, Activity, Pencil } from 'lucide-react'
import InlineEdit from '@/components/ui/InlineEdit'
import ExerciseVideoButton from '@/components/workout/ExerciseVideoButton'
import { SkeletonWorkoutDetail } from '@/components/ui/Skeleton'
import { Workout } from '@/types/workout'
import DeleteWorkoutModal from '@/components/workout/DeleteWorkoutModal'

export default function WorkoutDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const supabase = createClient()

  const goBack = () => {
    router.back()
  }
  
  const handleUpdateName = async (newName: string) => {
    try {
      setIsSavingName(true);
      setNameError(null);
      
      const response = await fetch(`/api/workouts/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: params.id,
          name: newName,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update workout name');
      }
      
      // Update local state with the new workout data
      setWorkout(data.workout);
      setIsEditingName(false);
      
    } catch (error: any) {
      console.error('Error updating workout name:', error);
      setNameError(error.message || 'Failed to update workout name');
    } finally {
      setIsSavingName(false);
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)

      // Use the API endpoint instead of direct Supabase access
      const response = await fetch(`/api/workouts/delete?id=${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete workout');
      }

      // First navigate to the workouts list page
      router.push('/protected/workouts')

      // Add a small delay before refreshing to ensure navigation completes
      setTimeout(() => {
        router.refresh()
      }, 100)
    } catch (error: any) {
      console.error('Error deleting workout:', error)
      setError(error.message || 'Error deleting workout')
      setIsDeleting(false)

      // Show error for 3 seconds, then allow retry
      setTimeout(() => {
        setError(null)
      }, 3000)
    }
  }

  useEffect(() => {
    async function fetchWorkout() {
      try {
        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error) {
          throw error
        }

        if (data) {
          setWorkout(data as unknown as Workout)
        } else {
          setError('Workout not found')
        }
      } catch (error: any) {
        setError(error.message || 'An error occurred while fetching the workout')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkout()
  }, [params.id, supabase])

  if (loading) {
    return (
      <>
        {/* Background accents - more subtle */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl opacity-40" />
          <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl opacity-40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_40%)]" />
        </div>

        {/* Main Content with Back Button */}
        <section className="mx-auto w-full max-w-3xl px-2 pb-10">
          {/* Back button positioned like in Profile view */}
          <div className="mb-2 relative z-10">
            <Link href="/protected/workouts">
              <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-xl hover:bg-white/10 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            </Link>
          </div>
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <svg className="animate-spin h-5 w-5 text-white mx-auto mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-xs text-white/70">Loading...</p>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {/* Background accents - more subtle */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl opacity-40" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_40%)]" />
      </div>

      {/* Main Content with Back Button */}
      <section className="mx-auto w-full max-w-3xl px-2 pb-10">
        {/* Back button positioned like in Profile view */}
        <div className="mb-2 relative z-10">
          <Link href="/protected/workouts">
            <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-xl hover:bg-white/10 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >

          {/* Header Section - more compact */}
          <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-2xl">
            <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-white/10 blur-2xl opacity-50" />
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-white/10 blur-2xl opacity-50" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-2">
                  {isEditingName ? (
                    <div className="mb-1">
                      <InlineEdit
                        value={workout?.name || `Workout ${new Date(workout?.created_at || '').toLocaleDateString()}`}
                        onChange={handleUpdateName}
                        onCancel={() => setIsEditingName(false)}
                        placeholder="Enter workout name..."
                        maxLength={50}
                      />
                      {nameError && (
                        <div className="text-[10px] text-red-400 mt-0.5">{nameError}</div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <h1 className="text-xl font-semibold tracking-tight flex items-center">
                        <Dumbbell className="h-5 w-5 mr-2 text-fuchsia-400" />
                        {workout?.name || `Workout ${new Date(workout?.created_at || '').toLocaleDateString()}`}
                      </h1>
                      <button 
                        onClick={() => setIsEditingName(true)}
                        className="ml-2 p-1 rounded-md hover:bg-white/10 text-white/60 transition-colors"
                        title="Edit workout name"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="mt-0.5 text-xs text-white/70">Review your personalized workout</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Link href="/protected/workouts/generate">
                    <button className="rounded-lg border border-white/10 bg-white/10 px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/20 transition-colors flex items-center gap-1.5">
                      <Play className="h-3.5 w-3.5" />
                      New
                    </button>
                  </Link>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition-colors"
                    disabled={isDeleting}
                    aria-label="Delete workout"
                  >
                    {isDeleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-300 backdrop-blur-xl">
                  {error}
                </div>
              )}
            </div>
          </div>

          {workout && (
            <>
              {/* Workout Overview */}
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-xl">
                  <div className="flex items-center justify-between p-2 border-b border-white/10">
                    <h3 className="text-xs font-medium text-white/90 flex items-center">
                      <Target className="h-3.5 w-3.5 mr-1" />
                      Overview
                    </h3>
                  </div>
                  <div className="p-2">
                    <div className="grid gap-2 grid-cols-2">
                      <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-2">
                        <div className="flex items-center gap-1 text-xs text-white/70">
                          <Clock className="h-3 w-3" />
                          Duration
                        </div>
                        <span className="text-xs font-medium text-white/90">{workout.total_duration_minutes}m</span>
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-2">
                        <div className="flex items-center gap-1 text-xs text-white/70">
                          <BarChart3 className="h-3 w-3" />
                          Exercises
                        </div>
                        <span className="text-xs font-medium text-white/90">{workout.workout_data.exercises.length}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-2">
                        <div className="flex items-center gap-1 text-xs text-white/70">
                          <Calendar className="h-3 w-3" />
                          Created
                        </div>
                        <span className="text-xs text-white/90">{new Date(workout.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 items-center rounded-md border border-white/10 bg-white/5 p-2">
                        <div className="flex items-center gap-1 text-xs text-white/70 mr-1">
                          <Target className="h-3 w-3" />
                          Focus:
                        </div>
                        {(() => {
                          // Handle different possible formats of workout_focus
                          let focusArray: any[] = [];
                          
                          if (Array.isArray(workout.workout_focus)) {
                            focusArray = workout.workout_focus;
                          } else {
                            const focusValue = workout.workout_focus as unknown as string;
                            if (typeof focusValue === 'string') {
                              if (focusValue.startsWith('[') && focusValue.endsWith(']')) {
                                try {
                                  focusArray = JSON.parse(focusValue);
                                } catch (e) {
                                  focusArray = [focusValue];
                                }
                              } else {
                                focusArray = [focusValue];
                              }
                            }
                          }
                          
                          return focusArray.slice(0, 2).map((focus: any, i: number) => {
                            const cleanFocus = typeof focus === 'string' ? focus.replace(/["']/g, '') : focus;
                            return (
                              <span key={i} className="text-[9px] px-1.5 py-0 rounded-full bg-cyan-500/20 text-cyan-300 capitalize">
                                {cleanFocus}
                              </span>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-2">
                      <div className="rounded-md border border-white/10 bg-white/5 p-2">
                        <div className="flex items-center gap-1 text-[10px] text-white/70 mb-1">
                          <Activity className="h-3 w-3" />
                          Muscle Groups
                        </div>
                        <p className="text-xs text-white/90 line-clamp-1">{workout.muscle_groups_targeted}</p>
                      </div>

                      <div className="rounded-md border border-white/10 bg-white/5 p-2">
                        <div className="flex items-center gap-1 text-[10px] text-white/70 mb-1">
                          <Zap className="h-3 w-3" />
                          Equipment
                        </div>
                        <p className="text-xs text-white/90 line-clamp-1">{workout.equipment_needed}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Exercises - more compact */}
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-xl">
                  <div className="flex items-center justify-between p-2 border-b border-white/10">
                    <h3 className="text-xs font-medium text-white/90 flex items-center">
                      <Dumbbell className="h-3.5 w-3.5 mr-1" />
                      Exercises ({workout.workout_data.exercises.length})
                    </h3>
                  </div>
                  <div className="p-2 space-y-2">
                    {workout.workout_data.exercises.map((exercise, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + index * 0.03 }}
                        className="rounded-md border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-fuchsia-500/20 to-cyan-400/20 border border-white/10 text-[10px] font-medium text-white/90">
                              {index + 1}
                            </div>
                            <h4 className="text-xs font-medium text-white/90">{exercise.name}</h4>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-white/70 ml-3">
                            <span className="text-white/60">Sets:</span>
                            <span className="text-white/90 font-medium">{exercise.sets}</span>
                            <span className="text-white/60 ml-1">Reps:</span>
                            <span className="text-white/90 font-medium">{exercise.reps}</span>
                            <span className="text-white/60 ml-1">Rest:</span>
                            <span className="text-white/90 font-medium">{exercise.rest_time_seconds}s</span>
                          </div>
                          <div className="ml-auto">
                            <ExerciseVideoButton exerciseName={exercise.name} size="small" variant="subtle" />
                          </div>
                        </div>

                        {exercise.rationale && (
                          <div className="mt-1 rounded-md border border-white/10 bg-white/5 p-1.5">
                            <div className="flex items-center gap-1 text-[9px] text-white/60 mb-0.5">
                              <Info className="h-2.5 w-2.5" />
                              TIPS
                            </div>
                            <p className="text-[10px] text-white/80 line-clamp-2">{exercise.rationale}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      </section>

      <DeleteWorkoutModal
        open={showDeleteConfirm}
        isDeleting={isDeleting}
        onCancel={() => {
          if (isDeleting) return
          setShowDeleteConfirm(false)
        }}
        onConfirm={handleDelete}
      />
    </>
  )
}
