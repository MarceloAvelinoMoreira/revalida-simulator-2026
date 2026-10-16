"""Extract the supplied booklet and its study key, without inventing content."""
import json,re,sys
from pathlib import Path
from pypdf import PdfReader
source=Path(sys.argv[1]); output=Path(sys.argv[2])
reader=PdfReader(source)
assert len(reader.pages) in (7,8)
pages=[]
for p in reader.pages[:-1]:
    text=p.extract_text()
    pages.append(text[text.index('QUESTÃO '):].strip())
text='\n'.join(pages)
key={int(n):letter for n,letter in re.findall(r'(?m)^(\d{2})\s*\n([ABCD])\s*$',reader.pages[-1].extract_text())}
blocks=re.split(r'QUESTÃO\s+(\d{2})\s*\|\s*(CM|CG|GO|PED|SC)\s*\n',text)
clean=lambda s:' '.join(s.replace('\xad','').split())
questions=[]
for i in range(1,len(blocks),3):
    number=int(blocks[i]); options=re.split(r'(?m)^\(([ABCD])\)\s*',blocks[i+2])
    assert options[1::2]==list('ABCD'),number
    questions.append(dict(number=number,area=blocks[i+1],text=clean(options[0]),opts=[clean(s) for s in options[2::2]],answer=key[number]))
assert len(questions) in (13,15)
assert [q['number'] for q in questions]==list(range(1,len(key)+1))
assert ''.join(q['answer'] for q in questions) in ('CBDDCBCDBCBDC','CBDDCBCDBCBDCDB')
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps(questions,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Extracted {len(questions)} questions and matching source answers.')
