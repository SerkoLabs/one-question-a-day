-- Development/test seed only. The complete reviewed 365-question seed is a later beta task.

insert into public.questions(day_index, category, depth, comparison_group_key, active)
values
  (1, 'daily_life', 1, null, true),
  (2, 'self', 2, 'success-definition', true),
  (3, 'relationships', 2, null, true),
  (4, 'values', 2, null, true),
  (5, 'future', 2, null, true),
  (6, 'fears', 3, null, true),
  (7, 'daily_life', 1, null, true)
on conflict (day_index) do update
set category = excluded.category,
    depth = excluded.depth,
    comparison_group_key = excluded.comparison_group_key,
    active = excluded.active;

insert into public.question_texts(question_id, locale, prompt, content_version)
select q.id, 'tr', seed.prompt, 1
from public.questions q
join (
  values
    (1::smallint, 'Bugün seni ne mutlu etti?'),
    (2::smallint, 'Başarı senin için bugün ne demek?'),
    (3::smallint, 'Kendini en rahat kimin yanında hissediyorsun?'),
    (4::smallint, 'Bu dönemde hayatında vazgeçmek istemediğin değer ne?'),
    (5::smallint, 'Bir yıl sonraki hayatında kesinlikle olmasını istediğin şey ne?'),
    (6::smallint, 'Şu anda kaybetmekten en çok korktuğun şey ne?'),
    (7::smallint, 'Bu haftanın aklında kalmasını istediğin anı neydi?')
) as seed(day_index, prompt)
  on seed.day_index = q.day_index
on conflict (question_id, locale) do update
set prompt = excluded.prompt,
    content_version = excluded.content_version,
    updated_at = now();
