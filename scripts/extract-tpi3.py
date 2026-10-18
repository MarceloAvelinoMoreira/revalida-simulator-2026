"""Import only supplied PDF content; interactive form selections are not answer keys."""
import json, re, sys
from pathlib import Path
from pypdf import PdfReader

source = Path(sys.argv[1])
root = Path(__file__).resolve().parent.parent
reader = PdfReader(source)
assert len(reader.pages) == 49
assert len(reader.get_fields() or {}) == 100

def page_text(i):
    lines = reader.pages[i].extract_text().splitlines()
    if lines and lines[0] == str(i+1):
        lines = lines[1:]
    return '\n'.join(line for line in lines if line not in ['CLÍNICA MÉDICA', 'CIRURGIA GERAL', 'GINECOLOGIA E OBSTETRÍCIA', 'PEDIATRIA', 'SAÚDE COLETIVA E MEDICINA DE FAMÍLIA', 'COMENTÁRIOS DAS QUESTÕES'] and not re.fullmatch(r'Questões \d+–\d+', line))

prefixes = {'pré','pós','recém','não','renina','sacubitril','materno','caso','custo','risco','anti','beta','alfa'}
def unwrap(s):
    s = s.replace('\xad', '')
    return re.sub(r'([\wÀ-ÿ]+)-\n\s*([\wÀ-ÿ])', lambda m: m[1]+('-' if m[1].lower() in prefixes else '')+m[2], s)
def clean(s):
    return ' '.join(unwrap(s).split())

keys = {int(n): letter for n,letter in re.findall(r'(?m)^(\d{2,3})\n([ABCD])$', page_text(22))}
assert set(keys) == set(range(1,101))
topics = {int(n):clean(title) for n,title in re.findall(r'(?m)^(\d{2,3})\n([A-Za-zÀ-ÿ][^\n]*)\n\.{3,}', page_text(1))}
assert set(topics) == set(keys), ('topics',len(topics),set(keys)-set(topics))
blocks = re.split(r'QUESTÃO (\d{2,3})\nCOMENTÁRIO\n', '\n'.join(page_text(i) for i in range(2,22)))
comments = re.split(r'QUESTÃO (\d{2,3})\nGabarito: ([ABCD])\nVOLTAR À QUESTÃO\n', '\n'.join(page_text(i) for i in range(23,49)))
comment_map = {}
for i in range(1,len(comments),3):
    n = int(comments[i])
    assert keys[n] == comments[i+1], ('key mismatch',n)
    body = unwrap(comments[i+2]).strip()
    body = re.sub(r'\n(?=(?:Questão |A questão |Os dados |O dado |Repare |A alternativa |As alternativas |Fonte:|O que você leva:))', '\n\n', body)
    comment_map[n] = '\n\n'.join(clean(p) for p in re.split(r'\n\s*\n', body) if p.strip())
assert set(comment_map) == set(keys)

images = {}
for page,n in [(5,21),(6,22),(17,80)]:
    assert len(reader.pages[page].images) == 1
    image = reader.pages[page].images[0]
    ext = Path(image.name).suffix.lower()
    assert ext in ['.png','.jpg','.jpeg']
    relative = f'assets/tpi-2026-2-tpi3/question-{n:03d}{ext}'
    target = root/'netlify-dist'/relative
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_bytes(image.data)
    images[n] = relative

questions = []
areas = [(21,'clinica_medica'),(41,'cirurgia'),(60,'ginecologia_obstetricia'),(80,'pediatria'),(100,'medicina_preventiva')]
for i in range(1,len(blocks),2):
    n = int(blocks[i])
    parts = re.split(r'(?m)^\(([ABCD])\)\s*', blocks[i+1])
    assert parts[1::2] == list('ABCD'), ('options',n,parts[1::2])
    text,opts = clean(parts[0]),[clean(p) for p in parts[2::2]]
    assert len(text)>100 and all(x for x in opts), n
    comment = comment_map[n]
    assert len(comment)>500 and 'Fonte:' in comment and 'O que você leva:' in comment, n
    questions.append(dict(n=n,text=text,opts=opts,answer=keys[n],comment=comment,topic=topics[n],area=next(area for end,area in areas if n<=end),image=images.get(n),takeHome=comment.split('O que você leva:',1)[1].strip()))
assert [q['n'] for q in questions] == list(range(1,101))
out = root/'tmp/pdfs/tpi3-extracted.json'
out.write_text(json.dumps(questions,ensure_ascii=False,indent=2),encoding='utf-8')
print('Extracted 100 statements, 400 alternatives, 100 matching keys and comments; 3 source images (Q21, Q22, Q80).')
