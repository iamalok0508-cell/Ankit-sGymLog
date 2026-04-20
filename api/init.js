import { query } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create tables
    await query(`
      CREATE TABLE IF NOT EXISTS exercises (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          muscle_group VARCHAR(50) NOT NULL,
          equipment_type VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS sessions (
          id SERIAL PRIMARY KEY,
          date DATE NOT NULL DEFAULT CURRENT_DATE,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS session_sets (
          id SERIAL PRIMARY KEY,
          session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
          exercise_id INTEGER REFERENCES exercises(id),
          set_number INTEGER NOT NULL CHECK (set_number >= 1 AND set_number <= 6),
          reps INTEGER NOT NULL,
          weight_kg DECIMAL(6,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(50) UNIQUE NOT NULL,
          value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await query('CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date DESC)');
    await query('CREATE INDEX IF NOT EXISTS idx_session_sets_session ON session_sets(session_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_session_sets_exercise ON session_sets(exercise_id)');

    // Check if exercises already exist
    const existingExercises = await query('SELECT COUNT(*) as count FROM exercises');
    
    if (existingExercises[0].count === 0) {
      // Insert default exercises
      const exercises = [
        ['Bench Press (Barbell)', 'Chest', 'Free Weight'],
        ['Incline Bench Press', 'Chest', 'Free Weight'],
        ['Chest Press Machine', 'Chest', 'Machine'],
        ['Cable Fly', 'Chest', 'Cable'],
        ['Dumbbell Fly', 'Chest', 'Free Weight'],
        ['Lat Pulldown', 'Back', 'Machine'],
        ['Seated Cable Row', 'Back', 'Cable'],
        ['Barbell Row', 'Back', 'Free Weight'],
        ['Deadlift', 'Back', 'Free Weight'],
        ['Pull-ups', 'Back', 'Bodyweight'],
        ['T-Bar Row', 'Back', 'Machine'],
        ['Leg Press', 'Legs', 'Machine'],
        ['Squat (Barbell)', 'Legs', 'Free Weight'],
        ['Leg Extension', 'Legs', 'Machine'],
        ['Leg Curl', 'Legs', 'Machine'],
        ['Calf Raise', 'Legs', 'Machine'],
        ['Romanian Deadlift', 'Legs', 'Free Weight'],
        ['Hack Squat', 'Legs', 'Machine'],
        ['Shoulder Press (Dumbbell)', 'Shoulders', 'Free Weight'],
        ['Shoulder Press Machine', 'Shoulders', 'Machine'],
        ['Lateral Raise', 'Shoulders', 'Free Weight'],
        ['Face Pull', 'Shoulders', 'Cable'],
        ['Front Raise', 'Shoulders', 'Free Weight'],
        ['Bicep Curl (Barbell)', 'Arms', 'Free Weight'],
        ['Bicep Curl (Dumbbell)', 'Arms', 'Free Weight'],
        ['Preacher Curl', 'Arms', 'Machine'],
        ['Tricep Pushdown', 'Arms', 'Cable'],
        ['Tricep Dips', 'Arms', 'Bodyweight'],
        ['Overhead Tricep Extension', 'Arms', 'Free Weight'],
        ['Hammer Curl', 'Arms', 'Free Weight']
      ];

      for (const [name, muscleGroup, equipmentType] of exercises) {
        await query(
          'INSERT INTO exercises (name, muscle_group, equipment_type) VALUES ($1, $2, $3)',
          [name, muscleGroup, equipmentType]
        );
      }
    }

    return res.status(200).json({ 
      message: 'Database initialized successfully',
      exercisesCount: existingExercises[0].count === 0 ? 30 : existingExercises[0].count
    });

  } catch (error) {
    console.error('Init Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
