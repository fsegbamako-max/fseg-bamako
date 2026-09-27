UPDATE public.etudiants_officiels
SET numero_ordre = regexp_replace(upper(trim(numero_ordre)), '[[:space:]]+', '', 'g')
WHERE numero_ordre IS NOT NULL;