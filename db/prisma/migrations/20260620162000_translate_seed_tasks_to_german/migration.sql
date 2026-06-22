-- Translate legacy quest seed tasks to German and keep user progress attached.

DO $$
DECLARE
    mapping text[];
    legacy_task_id integer;
    target_task_id integer;
    study_session_title CONSTANT text := '30 Minuten lernen';
    study_session_description CONSTANT text := 'Schließe eine fokussierte Lerneinheit ab.';
    study_session_feed_points CONSTANT text := '20';
    drink_water_title CONSTANT text := 'Wasser trinken';
    drink_water_description CONSTANT text := 'Trinke genug Wasser über den Tag verteilt.';
    drink_water_feed_points CONSTANT text := '10';
    clean_workspace_title CONSTANT text := 'Arbeitsplatz aufräumen';
    clean_workspace_description CONSTANT text := 'Räume deinen Schreibtisch oder Lernbereich auf.';
    clean_workspace_feed_points CONSTANT text := '15';
    task_mappings text[][] := ARRAY[
        ARRAY['Complete one study session', study_session_title, study_session_description, study_session_feed_points],
        ARRAY['Drink water', drink_water_title, drink_water_description, drink_water_feed_points],
        ARRAY['Clean workspace', clean_workspace_title, clean_workspace_description, clean_workspace_feed_points],
        ARRAY['Arbeitsplatz aufraeumen', clean_workspace_title, clean_workspace_description, clean_workspace_feed_points],
        ARRAY['Workspace aufraeumen', clean_workspace_title, clean_workspace_description, clean_workspace_feed_points],
        ARRAY['Workspace aufräumen', clean_workspace_title, clean_workspace_description, clean_workspace_feed_points]
    ];
BEGIN
    FOREACH mapping SLICE 1 IN ARRAY task_mappings LOOP
        SELECT id INTO legacy_task_id FROM "tasks" WHERE "title" = mapping[1];

        IF legacy_task_id IS NULL THEN
            CONTINUE;
        END IF;

        SELECT id INTO target_task_id FROM "tasks" WHERE "title" = mapping[2];

        IF target_task_id IS NULL THEN
            UPDATE "tasks"
            SET
                "title" = mapping[2],
                "description" = mapping[3],
                "feed_points" = mapping[4]::integer
            WHERE id = legacy_task_id;

            CONTINUE;
        END IF;

        DELETE FROM "user_tasks" user_task
        USING "user_tasks" duplicate
        WHERE user_task."task_id" = legacy_task_id
          AND duplicate."user_id" = user_task."user_id"
          AND duplicate."task_id" = target_task_id;

        UPDATE "user_tasks"
        SET "task_id" = target_task_id
        WHERE "task_id" = legacy_task_id;

        DELETE FROM "tasks"
        WHERE id = legacy_task_id;

        UPDATE "tasks"
        SET
            "description" = mapping[3],
            "feed_points" = mapping[4]::integer
        WHERE id = target_task_id;
    END LOOP;

    UPDATE "tasks"
    SET
        "description" = target_task.description,
        "feed_points" = target_task.feed_points
    FROM (
        VALUES
            (study_session_title, study_session_description, study_session_feed_points::integer),
            (drink_water_title, drink_water_description, drink_water_feed_points::integer),
            (clean_workspace_title, clean_workspace_description, clean_workspace_feed_points::integer)
    ) AS target_task(title, description, feed_points)
    WHERE "tasks"."title" = target_task.title;
END $$;
