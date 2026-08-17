-- El bucket 'adjuntos' nunca se creó (sí existía su policy), por eso fallaba
-- subir archivos al expediente del paciente. Límite 25 MB por archivo.

insert into storage.buckets (id, name, public, file_size_limit)
values ('adjuntos', 'adjuntos', false, 26214400)
on conflict (id) do update set file_size_limit = 26214400;
