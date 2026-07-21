-- Zona horaria CDMX para defaults de la base (#5).
-- Hace que current_date, current_time y la interpretación de timestamps sean
-- America/Mexico_City, coincidiendo con la hora de los pacientes en México.
alter database postgres set timezone to 'America/Mexico_City';
