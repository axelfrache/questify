INSERT INTO progression.achievements (code, name, description, icon, type, threshold, category_name)
VALUES
    ('FIRST_STEP',       'First Step',        'Complete your first quest',             '🎯', 'GENERAL',  1,  NULL),
    ('GETTING_STARTED',  'Getting Started',   'Complete 5 quests',                     '🚀', 'GENERAL',  5,  NULL),
    ('DEDICATED',        'Dedicated',         'Complete 25 quests',                    '💪', 'GENERAL',  25, NULL),
    ('VETERAN',          'Veteran',           'Complete 100 quests',                   '🏆', 'GENERAL',  100,NULL),
    ('WEEK_STREAK',      'Week Streak',       'Complete at least one quest every day for 7 days', '🔥', 'GENERAL',  7,  NULL),
    ('MONTHLY_MASTER',   'Monthly Master',    'Complete at least one quest every day for 30 days','👑', 'GENERAL',  30, NULL)
ON CONFLICT (code) DO NOTHING;
