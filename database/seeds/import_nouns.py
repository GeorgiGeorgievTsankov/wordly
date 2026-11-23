import csv

def sql_str(val):
    if val is None or val == '':
        return 'NULL'
    return "'" + str(val).replace("'", "''") + "'"

def sql_arr(val_list):
    if not val_list:
        return "ARRAY[]::text[]"
    escaped = [val.replace("'", "''") for val in val_list]
    joined = ",".join(f"'{item}'" for item in escaped)
    return f"ARRAY[{joined}]::text[]"

def generate_import_sql():
    with open('database/seeds/top_200_nouns.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    sql_statements = []
    sql_statements.append("BEGIN;")

    # 1. Staging table inserts
    sql_statements.append("-- 1. Insert into import_staging")
    staging_values = []
    for r in rows:
        rank_val = r['rank'].strip() if r['rank'].strip() else 'NULL'
        hw = sql_str(r['headword'].strip())
        pos = sql_str(r['part_of_speech'].strip())
        trans = sql_str(r['translation'].strip())
        acc = sql_str(r.get('accepted_translations', '').strip())
        definition = sql_str(r.get('definition', '').strip())
        ex_en = sql_str(r.get('example_en', '').strip())
        ex_bg = sql_str(r.get('example_bg', '').strip())
        cat = sql_str('Nouns')
        diff = sql_str(r.get('difficulty', '').strip() or 'beginner')
        src = sql_str(r.get('source', '').strip() or 'top_200_nouns')
        staging_values.append(f"({rank_val}, {hw}, {pos}, {trans}, {acc}, {definition}, {ex_en}, {ex_bg}, {cat}, {diff}, {src})")
    
    joined_staging = ',\n'.join(staging_values)
    sql_statements.append(f"""
    INSERT INTO public.import_staging (
        rank, headword, part_of_speech, translation, accepted_translations, definition, example_en, example_bg, category, difficulty, source
    ) VALUES \n{joined_staging};
    """)

    # 2. Group by headword and part_of_speech for words table
    grouped = {}
    for r in rows:
        hw = r['headword'].strip()
        norm = hw.lower()
        pos = r['part_of_speech'].strip()
        key = (norm, pos)
        if key not in grouped:
            grouped[key] = {
                'headword': hw,
                'normalized_headword': norm,
                'part_of_speech': pos,
                'rank': r['rank'].strip() if r['rank'].strip() else 'NULL',
                'difficulty': r.get('difficulty', '').strip() or 'beginner',
                'source': r.get('source', '').strip() or 'top_200_nouns',
                'meanings': []
            }
        
        raw_acc = r.get('accepted_translations', '').strip()
        acc_list = [x.strip() for x in raw_acc.split('|') if x.strip()] if raw_acc else []

        grouped[key]['meanings'].append({
            'translation': r['translation'].strip(),
            'accepted_translations': acc_list,
            'definition': r.get('definition', '').strip() or None,
            'example_en': r.get('example_en', '').strip() or None,
            'example_bg': r.get('example_bg', '').strip() or None,
        })

    # Insert into words
    sql_statements.append("-- 2. Insert into words")
    words_values = []
    for (norm, pos), data in grouped.items():
        hw = sql_str(data['headword'])
        norm_hw = sql_str(data['normalized_headword'])
        pos_sql = sql_str(data['part_of_speech'])
        diff = sql_str(data['difficulty'])
        src = sql_str(data['source'])
        rnk = data['rank']
        words_values.append(f"({hw}, {norm_hw}, {pos_sql}, {diff}, false, {src}, {rnk}, 'active')")
    
    joined_words = ',\n'.join(words_values)
    sql_statements.append(f"""
    INSERT INTO public.words (
        headword, normalized_headword, part_of_speech, difficulty, is_phrase, source, source_rank, status
    ) VALUES \n{joined_words}
    ON CONFLICT (normalized_headword, part_of_speech) DO UPDATE
    SET source = EXCLUDED.source,
        source_rank = EXCLUDED.source_rank,
        status = 'active',
        updated_at = now();
    """)

    # 3. Associate with Nouns category (UUID: 4a9d2566-a9fe-422a-b710-cf0324d758a2)
    sql_statements.append("-- 3. Link to Nouns category")
    sql_statements.append("""
    INSERT INTO public.word_categories (word_id, category_id)
    SELECT w.id, '4a9d2566-a9fe-422a-b710-cf0324d758a2'::uuid
    FROM public.words w
    WHERE w.part_of_speech = 'noun'
    ON CONFLICT (word_id, category_id) DO NOTHING;
    """)

    # 4. Insert meanings
    sql_statements.append("-- 4. Insert word_meanings")
    sql_statements.append("""
    DELETE FROM public.word_meanings
    WHERE word_id IN (SELECT id FROM public.words WHERE part_of_speech = 'noun');
    """)

    meanings_values = []
    for (norm, pos), data in grouped.items():
        for order, m in enumerate(data['meanings']):
            trans = sql_str(m['translation'])
            acc = sql_arr(m['accepted_translations'])
            defn = sql_str(m['definition'])
            ex_en = sql_str(m['example_en'])
            ex_bg = sql_str(m['example_bg'])
            meanings_values.append(
                f"((SELECT id FROM public.words WHERE normalized_headword = {sql_str(norm)} AND part_of_speech = 'noun'), "
                f"{trans}, {acc}, {defn}, {ex_en}, {ex_bg}, {order})"
            )

    joined_meanings = ',\n'.join(meanings_values)
    sql_statements.append(f"""
    INSERT INTO public.word_meanings (
        word_id, translation, accepted_translations, definition, example_en, example_bg, sort_order
    ) VALUES \n{joined_meanings};
    """)

    sql_statements.append("COMMIT;")
    return "\n".join(sql_statements)

if __name__ == '__main__':
    sql = generate_import_sql()
    with open('database/seeds/import_nouns.sql', 'w', encoding='utf-8') as out:
        out.write(sql)
    print("Generated database/seeds/import_nouns.sql successfully.")
