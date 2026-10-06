"""Deterministic import of the supplied Quinzena 01 PDF, without invented text."""
import argparse, json, re
from pathlib import Path
import pymupdf

parser = argparse.ArgumentParser()
parser.add_argument('pdf')
parser.add_argument('--mobile-pdf', help='Optional matching mobile edition for clearer source captures')
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
doc = pymupdf.open(args.pdf)
tmp = root / 'tmp/pdfs/quinzena'
tmp.mkdir(parents=True, exist_ok=True)
for i in [2, 24, 25, 26, 51]:
    doc[i].get_pixmap(matrix=pymupdf.Matrix(1.4, 1.4)).save(str(tmp / f'page-{i+1}.png'))

def clean(text):
    text = re.sub(r'Plano de tutoria[^\n]*\n\d+\s*(?:\n|$)', '', text)
    text = re.sub(r'(\w)\xad?‐\s*\n\s*(\w)', r'\1\2', text)
    return text.replace('\xad','').strip()

stems = clean('\n'.join(p.get_text() for p in list(doc)[2:25]))
solutions = clean('\n'.join(p.get_text() for p in list(doc)[26:]))
qs = re.split(r'QUESTÃO\s+(\d+)\s*\nVER RESPOSTA\s*\n', stems)
cs = re.split(r'QUESTÃO\s+(\d+)\s+', solutions)
comments = {int(cs[i]):cs[i+1] for i in range(1,len(cs),2)}
key = {int(n):(letter, bool(star)) for n,letter,star in re.findall(r'(\d{2,3})\s+(?:ENAMED|ENADE|ENARE|REVALIDA)\s+[^\n]*?Q\d+\s+([A-E])(\*?)', doc[25].get_text())}
assert len(key)==100, f'Expected 100 table entries, got {len(key)}'
questions, issues = [], []
for i in range(1,len(qs),2):
    n = int(qs[i]); block = qs[i+1].split('comentário completo')[0].strip()
    source, body = block.split('\n',1)
    parts = re.split(r'(?:^|\n)\(([A-E])\)\s*',body)
    text = ' '.join(parts[0].split())
    letters = parts[1::2]
    opts = [' '.join(s.split()) for s in parts[2::2]]
    comment = comments[n]
    match = re.search(r'RESPOSTA CORRETA:\s*\(([A-E])\)',comment)
    assert match, n
    answer = match[1]
    assert key[n][0]==answer, f'Answer table/comment discrepancy at {n}'
    pre, explanation = comment.split('COMENTÁRIO',1)
    taxonomy = next(line for line in reversed(pre.splitlines()) if '›' in line).strip()
    explanation = re.split(r'\nGabarito (?:oficial|preliminar)',explanation)[0].strip()
    explanation = ' '.join(explanation.split())
    if letters != list('ABCDE'[:len(letters)]) or len(opts)<4 or not all(opts):
        issues.append({'n':n,'reason':'Missing/incomplete options in PDF extraction','letters':letters})
    q = dict(n=n,id=f'quinzena-01-{n:03}',edition='quinzena-01',year='quinzena-01',questionNumber=n,
             text=text,statement=text,opts=opts,alternatives=opts,answer=answer,correctAnswer=answer,
             source=source,commentTopic=taxonomy,officialComment=explanation,explanation=explanation,
             answerStatus='preliminary-or-source-note' if key[n][1] else 'as-recorded-in-pdf',
             tags=['QUINZENA 01',*taxonomy.split(' › ')])
    if n==99:
        warning='Nota de importação: a alternativa D está incompleta no próprio PDF. O trecho disponível foi preservado; não foi inventada sua continuação.'
        q['text']=q['statement']=text+'\n\n'+warning
        q['officialComment']=q['explanation']=warning+'\n\n'+explanation
        q['sourceIssue']='incomplete-alternative-D'
        issues.append({'n':n,'reason':warning})
    if key[n][1]:
        q['officialComment']='Atenção: este gabarito possui asterisco no caderno; consultar a ressalva da fonte. ENAMED 2026 é identificado no PDF como preliminar.\n\n'+q['officialComment']
    for number,page_index,rect in [(64,16,(298,278,561,446)),(77,19,(36,176,291,306))]:
        if n==number:
            target=root/'netlify-dist/assets/quinzena-01'/f'tabela-{n}.png'
            target.parent.mkdir(parents=True,exist_ok=True)
            doc[page_index].get_pixmap(matrix=pymupdf.Matrix(3,3),clip=pymupdf.Rect(rect)).save(str(target))
            q['image']=f'assets/quinzena-01/tabela-{n}.png'
    questions.append(q)
assert [q['n'] for q in questions] == list(range(1,101)), 'Expected PDF questions 1–100'
(tmp/'extraction.json').write_text(json.dumps({'questions':questions,'issues':issues},ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'questions':len(questions),'comments':len(comments),'issues':issues},ensure_ascii=False))
assert len(issues)==1 and issues[0]['n']==99, 'Unexpected source issue: inspect before import'
if args.mobile_pdf:
    mobile = pymupdf.open(args.mobile_pdf)
    def normalized(value):
        value = re.sub(r'(?<=\w)[\-‐\xad]\s*\n\s*(?=\w)', '', value)
        return ''.join(c for c in value.lower() if c.isalnum())
    checked = set()
    for page in mobile:
        content = page.get_text()
        marker = re.search(r'\nQuestão (\d+)\n', content)
        if not marker or 'ENUNCIADO\n' not in content:
            continue
        number = int(marker[1]); question = questions[number-1]
        body = content.split('ENUNCIADO\n',1)[1].split('\nRevisar depois')[0]
        parts = re.split(r'(?:^|\n)([A-E])\)\s*', body)
        assert normalized(parts[0]) == normalized(question['text'].split('\n\nNota de importação:')[0]), number
        assert normalized('|'.join(parts[2::2])) == normalized('|'.join(question['opts'])), number
        checked.add(number)
        if number in [64,77]:
            lines = [line for block in page.get_text('dict')['blocks'] if 'lines' in block for line in block['lines']]
            def line_text(line):
                return ''.join(span['text'] for span in line['spans'])
            if number == 64:
                first = next(line for line in lines if line_text(line).startswith('Idade (meses)'))
                last = next(line for line in lines if line_text(line).startswith('15 |'))
                clip = pymupdf.Rect(28,first['bbox'][1]-3,page.rect.width-28,last['bbox'][3]+3)
            else:
                # Preserve the full source body, including both lab panels and threshold data.
                heading = next(line for line in lines if line_text(line)=='ENUNCIADO')
                option = next(line for line in lines if line_text(line).startswith('A)'))
                clip = pymupdf.Rect(28,heading['bbox'][3]+4,page.rect.width-28,option['bbox'][1]-12)
            target = root/'netlify-dist'/question['image']
            page.get_pixmap(matrix=pymupdf.Matrix(3,3),clip=clip,annots=False).save(str(target))
    assert checked == set(range(1,101)), 'Mobile edition must contain the same 100 questions'
    print('Mobile edition verified: 100 matching questions; clearer source captures for 64 and 77.')
(root/'netlify-dist/js/questions-quinzena-01.js').write_text('// Imported from Quinzena 01: 100 questions, answers and comments preserved.\nEXAMS["quinzena-01"] = '+json.dumps({'label':'QUINZENA 01','questions':questions},ensure_ascii=False,indent=2)+';\n',encoding='utf8')
# Append source-provided taxonomy without reclassifying any existing question.
mapping_file=root/'netlify-dist/js/question-classification.js'
mapping=json.loads(mapping_file.read_text(encoding='utf8').split('const QuestionClassification = ',1)[1].strip().rstrip(';'))
report_file=root/'netlify-dist/data/question-classification-report.json'
report=json.loads(report_file.read_text(encoding='utf8'))
report['questions']=[r for r in report['questions'] if r.get('edicao')!='quinzena-01']
area_ids={'Clínica Médica':'clinica_medica','Cirurgia Geral':'cirurgia','Ginecologia e Obstetrícia':'ginecologia_obstetricia','Pediatria':'pediatria','Saúde Coletiva':'medicina_preventiva'}
for q in questions:
    a,s,t=q['commentTopic'].split(' › ')
    metadata=dict(grandeArea=area_ids[a],subarea=s,tema=t,classificacaoPendente=False,fonte='Taxonomia individual da resolução no PDF Quinzena 01')
    mapping[q['id']]=metadata
    report['questions'].append(dict(id=q['id'],prova='QUINZENA 01',edicao='quinzena-01',numero=q['n'],**metadata))
report['total']=len(report['questions'])
report['pending']=sum(r['classificacaoPendente'] for r in report['questions'])
report['classified']=report['total']-report['pending']
report['distribution']={a:sum(r['grandeArea']==a for r in report['questions']) for a in area_ids.values()}
mapping_file.write_text('// Metadata: existing classifications preserved; Quinzena 01 taxonomy imported from source.\nconst QuestionClassification = '+json.dumps(mapping,ensure_ascii=False,indent=2)+';\n',encoding='utf8')
report_file.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
