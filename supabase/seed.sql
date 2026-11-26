insert into public.study_units
  (id, unit_number, level, filter_levels, title, description)
values
  (
    'unit-01', 1, 'A2+', array['a2'],
    'Updates asíncronos en Slack, Jira y Linear',
    'Reportar avances cortos, pedir contexto de un ticket y confirmar despliegues sin sonar robótico.'
  ),
  (
    'unit-02', 2, 'A2+ → B1', array['a2', 'b1'],
    'Daily Standups y cómo explicar blockers',
    'Hablar en tiempo pasado y presente continuo para resumir tu trabajo en 90 segundos frente a un equipo en EE. UU.'
  ),
  (
    'unit-03', 3, 'B1', array['b1'],
    'Code Reviews y Pull Requests constructivos',
    'Sugerir cambios de código con tacto profesional (“nit:”, “consider…”) y defender tus decisiones sin sonar brusco.'
  ),
  (
    'unit-04', 4, 'B1+', array['b1', 'b2'],
    'Incidentes en producción, debugging y post-mortems',
    'Comunicar causas raíz, métricas de latencia y pasos de mitigación bajo presión en llamadas con producto.'
  ),
  (
    'unit-05', 5, 'B2 Meta', array['b2'],
    'Entrevistas técnicas, System Design y negociación en USD',
    'Pensar en voz alta en live coding, responder preguntas conductuales con STAR y negociar compensación remota con seguridad.'
  )
on conflict (id) do update set
  unit_number = excluded.unit_number,
  level = excluded.level,
  filter_levels = excluded.filter_levels,
  title = excluded.title,
  description = excluded.description;

insert into public.study_activities
  (id, unit_id, position, title, activity_type, duration_minutes, phrase, practice_key)
values
  (
    'u1-t1', 'unit-01', 1,
    'Escribir: Pedir contexto de un ticket en Slack',
    'Slack-Escritura', 5,
    'Hey Sarah, quick question on ENG-412: should we keep backwards compatibility for v1 clients or deprecate it in this release?',
    'Usa “quick question on [ticket]” para ir directo al grano sin disculparte de más.'
  ),
  (
    'u1-t2', 'unit-01', 2,
    'Vocabulario: Estados de ticket y PR',
    'Vocabulario', 4,
    'merged, cherry-picked, stale branch, hotfix, rollback, edge case, repro steps, flaky test.',
    'Domina estos 8 términos para entender hilos de Slack y comentarios en GitHub al instante.'
  ),
  (
    'u1-t3', 'unit-01', 3,
    'Speaking: Confirmar un fix en staging',
    'Speaking', 6,
    'I just deployed the fix to staging. Could you verify it on your end when you have a minute?',
    '“On your end” es la forma natural en equipos remotos de decir “de tu lado / en tu entorno”.'
  ),
  (
    'u2-t1', 'unit-02', 1,
    'Vocabulario: Conectores rápidos para tu standup',
    'Vocabulario', 4,
    'Yesterday I wrapped up the pagination refactor and opened a PR for review. Today I’m tackling the caching layer.',
    'Usa “wrapped up” (terminé) y “I’m tackling” (estoy trabajando en) para sonar fluido en standups.'
  ),
  (
    'u2-t2', 'unit-02', 2,
    'Reportar un blocker técnico sin trabarte',
    'Speaking', 6,
    'I’m currently blocked on the auth endpoint because the staging token expires too quickly. Could someone pair with me after the call?',
    'En lugar de decir solo “I have a problem”, usa “I’m blocked on [tarea] because [causa]” y cierra pidiendo una acción concreta.'
  ),
  (
    'u2-t3', 'unit-02', 3,
    'Escribir un update por retraso en Slack',
    'Slack-Escritura', 5,
    'Heads up: the migration script took longer than expected due to legacy null values. I’ll push the updated PR by 3 PM EST.',
    'Empieza con “Heads up:” para avisar con tiempo, explica la causa técnica en una línea y da una hora estimada clara.'
  ),
  (
    'u3-t1', 'unit-03', 1,
    'PR Review: Sugerir refactors con tacto',
    'Slack-Escritura', 6,
    'Nit: we could extract this validation into a shared helper so it’s easier to unit test. Thoughts?',
    'Prefija detalles menores con “Nit:” y cierra con “Thoughts?” para invitar al diálogo.'
  ),
  (
    'u3-t2', 'unit-03', 2,
    'Speaking: Justificar una decisión de base de datos',
    'Speaking', 7,
    'We went with PostgreSQL over Mongo here because we needed strict ACID guarantees for billing transactions.',
    'La estructura “We went with [X] over [Y] because…” ayuda a justificar decisiones en revisiones de diseño.'
  ),
  (
    'u3-t3', 'unit-03', 3,
    'Vocabulario: Explicar trade-offs técnicos',
    'Vocabulario', 5,
    'The main trade-off is between lower latency and the extra complexity of maintaining a cache.',
    'Usa “trade-off” para presentar con claridad las ventajas y los costes de una decisión.'
  ),
  (
    'u4-t1', 'unit-04', 1,
    'Escribir un resumen para el incident channel',
    'Slack-Escritura', 6,
    'We’ve identified the root cause and are rolling back the latest release to restore service.',
    'Separa el estado actual de la acción siguiente para que el equipo pueda escanear el update rápidamente.'
  ),
  (
    'u4-t2', 'unit-04', 2,
    'Speaking: Explicar la causa raíz de un incidente',
    'Speaking', 8,
    'The spike in latency was caused by a connection pool exhaustion after the traffic increase.',
    'Describe el síntoma, la causa raíz y la mitigación en ese orden.'
  ),
  (
    'u4-t3', 'unit-04', 3,
    'Vocabulario de observabilidad',
    'Vocabulario', 5,
    'latency spike, error budget, saturation, trace, mitigation, rollback.',
    'Practica estos términos para explicar métricas y decisiones durante un post-mortem.'
  ),
  (
    'u5-t1', 'unit-05', 1,
    'Speaking: Mock interview de System Design',
    'Speaking', 12,
    'I’d start by clarifying the expected traffic and consistency requirements before choosing the storage layer.',
    'Explica tu razonamiento paso a paso y aclara los requisitos antes de proponer una arquitectura.'
  ),
  (
    'u5-t2', 'unit-05', 2,
    'Presentar tu experiencia con el método STAR',
    'Speaking', 8,
    'In my previous role, I led a migration that reduced deployment time by 40 percent.',
    'Enlaza situación, tarea, acción y resultado; destaca el impacto medible de tu trabajo.'
  ),
  (
    'u5-t3', 'unit-05', 3,
    'Escribir una propuesta de compensación remota',
    'Slack-Escritura', 7,
    'Based on the scope of the role and my experience, I was hoping we could discuss a range closer to…',
    'Mantén un tono seguro y colaborativo, y respalda tu propuesta con el alcance del rol.'
  )
on conflict (id) do update set
  unit_id = excluded.unit_id,
  position = excluded.position,
  title = excluded.title,
  activity_type = excluded.activity_type,
  duration_minutes = excluded.duration_minutes,
  phrase = excluded.phrase,
  practice_key = excluded.practice_key;
