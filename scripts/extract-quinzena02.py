"""Read the supplied booklet, removing overlapping accessibility-only syllable spaces."""
import json, re, sys, unicodedata
from pathlib import Path
import pdfplumber

root = Path(__file__).resolve().parent.parent
source = Path(sys.argv[1])

def text(page):
    chars = page.chars
    output, previous = [], None
    for i, c in enumerate(chars):
        if c['text'].isspace() and i+1 < len(chars):
            nxt = chars[i+1]
            if abs(nxt['top']-c['top']) < 2 and nxt['x0'] <= c['x0']+0.5:
                continue
        if previous and (abs(c['top']-previous['top']) > 4 or c['x0'] < previous['x0']-20):
            output.append('\n')
        output.append(c['text'])
        previous = c
    return unicodedata.normalize('NFKC', ''.join(output))

out = root/'tmp/pdfs/quinzena02-pages.json'
out.parent.mkdir(parents=True,exist_ok=True)
if '--cached' in sys.argv:
    pages = json.loads(out.read_text(encoding='utf8'))
else:
    with pdfplumber.open(source) as doc:
        pages = [text(p) for p in doc.pages]
    out.write_text(json.dumps(pages,ensure_ascii=False,indent=2),encoding='utf8')
assert len(pages) == 51

def clean(s):
    # Only join line-end typesetting hyphens; keep lexical compounds.
    prefixes = {'pré','pós','recém','não','médio','pronto','médico','caso','materno','custo','beta','alfa'}
    s = re.sub(r'([\wÀ-ÿ]+)-\n\s*([\wÀ-ÿ])',lambda m:m[1]+('-' if m[1].lower() in prefixes else '')+m[2],s)
    return ' '.join(s.split())

def without_footer(s):
    return re.sub(r'(?m)^Plano de tutoria P9-P10[^\n]*\n?', '', s)

key_rows = re.findall(r'(\d{2,3})((?:ENAMED|REVALIDA|ENARE|ENADE)[^\n]*?· Q\d+)([ABCDE])(\*?)', pages[25])
keys = {int(n):(letter,bool(star),clean(origin)) for n,origin,letter,star in key_rows}
assert set(keys)==set(range(1,101)), ('key',len(keys))
comment_parts = re.split(r'QUESTÃO (\d{2,3})([^\n]+)‹ voltar à questão\n', '\n'.join(without_footer(p) for p in pages[26:]))
comments = {}
for i in range(1,len(comment_parts),3):
    n,origin,body = int(comment_parts[i]),clean(comment_parts[i+1]),comment_parts[i+2]
    match = re.match(r'✔ RESPOSTA CORRETA: \(([ABCDE])\)\n([\s\S]+?)\nCOMENTÁRIO\n([\s\S]+)',body)
    assert match, ('comment',n)
    letter, lead, explanation = match.groups()
    assert keys[n][0]==letter and keys[n][2]==origin, ('key/comment disagreement',n)
    lead_lines = lead.splitlines()
    taxonomy_start = next(j for j,line in enumerate(lead_lines) if ' › ' in line)
    taxonomy = clean('\n'.join(lead_lines[taxonomy_start:])).split(' › ')
    assert len(taxonomy)==3, (n,taxonomy)
    provided_answer = clean('\n'.join(lead_lines[:taxonomy_start]))
    explanation = clean(explanation)
    # Retain source justification and status; do not claim independent medical validation.
    explanation = re.sub(r' (?=[ABCDE] está (?:correta|errada))','\n\n',explanation)
    explanation = re.sub(r' (?=Gabarito (?:oficial|preliminar) ·)','\n\n',explanation)
    comments[n] = dict(comment=explanation,taxonomy=taxonomy,providedAnswer=provided_answer)
assert set(comments)==set(keys)

question_parts = re.split(r'QUESTÃO (\d{2,3})VER RESPOSTA([^\n]+)\n','\n'.join(without_footer(p) for p in pages[2:25]))
area_names = {'Clínica Médica':'clinica_medica','Cirurgia Geral':'cirurgia','Ginecologia e Obstetrícia':'ginecologia_obstetricia','Pediatria':'pediatria','Saúde Coletiva':'medicina_preventiva'}
questions = []
for i in range(1,len(question_parts),3):
    n,origin,body = int(question_parts[i]),clean(question_parts[i+1]),question_parts[i+2]
    assert 'comentário completo ›' in body, ('missing end',n)
    body = body.split('comentário completo ›',1)[0].strip()
    parts = re.split(r'(?m)^\(([A-E])\)\s*',body)
    letters,opts = parts[1::2],[clean(p) for p in parts[2::2]]
    assert letters in [list('ABCD'),list('ABCDE')], ('options',n,letters)
    statement=clean(parts[0])
    if n==6:
        assert statement.startswith('eom—p—p—c-———-— O câncer')
        statement=statement[statement.index('O câncer'):]
    answer,star,source_name = keys[n]
    assert source_name==origin and answer in letters, ('origin/key',n)
    assert len(statement)>65 and min(map(len,opts))>0, ('content',n)
    c = comments[n]
    assert len(c['comment'])>150, ('short comment',n)
    questions.append(dict(n=n,text=statement,opts=opts,answer=answer,provisional=star,source=origin,area=area_names[c['taxonomy'][0]],topic=c['taxonomy'][2],subarea=c['taxonomy'][1],**c))
assert [q['n'] for q in questions]==list(range(1,101))
(root/'tmp/pdfs/quinzena02-extracted.json').write_text(json.dumps(questions,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'questions':len(questions),'matchingComments':len(comments),'starredSourceKeys':[q['n'] for q in questions if q['provisional']],'alternatives':sum(len(q['opts']) for q in questions)},ensure_ascii=False))
