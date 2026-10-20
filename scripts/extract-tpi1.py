"""Transcribe the supplied TPI 1 booklet; do not reinterpret its answer key."""
import json, re, sys, unicodedata
from pathlib import Path
from pypdf import PdfReader

root=Path(__file__).resolve().parent.parent
reader=PdfReader(sys.argv[1])
assert len(reader.pages)==34

def page_text(i):
    s=unicodedata.normalize('NFKC',reader.pages[i].extract_text())
    s=re.sub(r'(?m)^'+str(i+1)+r'\s*$','',s)
    return re.sub(r'(?m)^(?:CLÍNICA MÉDICA|CIRURGIA GERAL|GINECOLOGIA E OBSTETRÍCIA|PEDIATRIA|SAÚDE COLETIVA) Questões \d+–\d+\n?','',s)

def clean(s):
    prefixes={'pré','pós','recém','não','médio','pronto','médico','materno','custo','caso','beta','alfa'}
    s=re.sub(r'([\wÀ-ÿ]+)-\n\s*([\wÀ-ÿ])',lambda m:m[1]+('-' if m[1].lower() in prefixes else '')+m[2],s)
    return ' '.join(s.split())

keys={int(n):letter for n,letter in re.findall(r'\b(\d{2,3})\s+([ABCDE])\b',page_text(21))}
assert set(keys)==set(range(1,101))
comments={}
blocks=re.split(r'QUESTÃO (\d{2,3}) Gabarito: ([ABCDE])\n','\n'.join(page_text(i) for i in range(22,34)))
for i in range(1,len(blocks),3):
    n=int(blocks[i]);assert keys[n]==blocks[i+1], ('key mismatch',n)
    taxonomy,body=blocks[i+2].split('Justificativa da resposta correta:',1)
    taxonomy=clean(taxonomy).split(' · ')
    assert len(taxonomy)==3, (n,taxonomy)
    body='Justificativa da resposta correta: '+clean(body)
    body=body.replace(' Comentários sobre as alternativas incorretas:','\n\nComentários sobre as alternativas incorretas:')
    assert 'Comentários sobre as alternativas incorretas:' in body and len(body)>300,n
    comments[n]=dict(comment=body,taxonomy=taxonomy)
assert set(comments)==set(keys)

images={}
for page,n in [(3,10),(6,26)]:
    assert len(reader.pages[page].images)==1
    image=reader.pages[page].images[0]
    ext=Path(image.name).suffix.lower();assert ext in ['.png','.jpg','.jpeg']
    relative=f'assets/tpi-2026-2-tpi1/question-{n:03}{ext}'
    target=root/'netlify-dist'/relative;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(image.data)
    images[n]=relative

questions=[]
blocks=re.split(r'QUESTÃO (\d{2,3})\n','\n'.join(page_text(i) for i in range(2,21)))
areas=[(31,'clinica_medica'),(47,'cirurgia'),(70,'ginecologia_obstetricia'),(89,'pediatria'),(100,'medicina_preventiva')]
for i in range(1,len(blocks),2):
    n=int(blocks[i]);parts=re.split(r'(?m)^\(([ABCDE])\)\s*',blocks[i+1])
    assert parts[1::2]==list('ABCDE'), ('options',n,parts[1::2])
    statement,opts=clean(parts[0]),[clean(s) for s in parts[2::2]]
    assert len(statement)>65 and all(opts), ('content',n)
    assert opts[ord(keys[n])-65]!='NÃO MARCAR', ('placeholder key',n)
    questions.append(dict(n=n,text=statement,opts=opts,answer=keys[n],area=next(area for end,area in areas if n<=end),image=images.get(n),**comments[n]))
assert [q['n'] for q in questions]==list(range(1,101))
target=root/'tmp/pdfs/tpi1-extracted.json';target.parent.mkdir(parents=True,exist_ok=True)
target.write_text(json.dumps(questions,ensure_ascii=False,indent=2),encoding='utf8')
print('100 questions, 500 alternatives and 100 matching keys/comments; original images Q10 and Q26.')
