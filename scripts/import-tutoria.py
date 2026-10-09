"""Import the paired student booklet and commentary report without inventing answers."""
import argparse, json, re
from pathlib import Path
from pypdf import PdfReader

parser=argparse.ArgumentParser()
parser.add_argument('student');parser.add_argument('comments');args=parser.parse_args()
root=Path(__file__).resolve().parent.parent
student=PdfReader(args.student);report=PdfReader(args.comments)
def clean(s):
    return re.sub(r'(?<=\w)[\-\xad]\s*\n\s*(?=\w)','',s).replace('\xad','')
text='\n'.join(re.sub(r'\n\d+\s*$','',clean(p.extract_text())) for p in student.pages)
parts=re.split(r'Questão\s+(\d{2})\s+(CM|CG|GO|PED|SC)\s*\n',text)
key={int(n):answer for n,answer in re.findall(r'(\d{2})\s*\n[^\n]+\n([ABCD])(?:\n|$)',report.pages[1].extract_text())}
comments={};topics={}
for page in report.pages[2:12]:
    blocks=re.split(r'Questão (\d{2}) \| ([^\n]+)\n',clean(page.extract_text()))
    for i in range(1,len(blocks),3):
        n=int(blocks[i]);topics[n]=' '.join(blocks[i+1].split());comments[n]=' '.join(blocks[i+2].split())
assert set(key)==set(comments)==set(range(1,21)), 'Expected 20 matching keys and comments'
areas={'CM':('clinica_medica','Clínica Médica'),'CG':('cirurgia','Cirurgia Geral'),'GO':('ginecologia_obstetricia','Ginecologia e Obstetrícia'),'PED':('pediatria','Pediatria'),'SC':('medicina_preventiva','Saúde Coletiva')}
questions=[];metadata={}
notice='Gabarito comentado de estudo fornecido pelo usuário; não é um gabarito oficial publicado pela instituição.'
for i in range(1,len(parts),3):
    n=int(parts[i]);area=parts[i+1];body=parts[i+2].split('Folha de respostas')[0].strip()
    alternatives=re.split(r'(?:^|\n)([A-D])\s+',body)
    assert alternatives[1::2]==list('ABCD'), n
    opts=[' '.join(s.split()) for s in alternatives[2::2]]
    stem=' '.join(alternatives[0].split());answer=key[n]
    assert re.search(r'Alternativa correta:\s*'+answer+r'\.',comments[n]), n
    comment=notice+'\n\n'+comments[n]
    if n in [9,19]:
        comment+='\n\n'+('Referência da ressalva: Ministério da Saúde, Diretrizes Brasileiras para o Rastreamento do Câncer do Colo do Útero, Parte I; Portaria Conjunta SAES/SECTICS nº 13, de 29/07/2025.' if n==9 else 'Referência da ressalva: Ministério da Saúde, Declaração de Óbito: Manual de Instruções para Preenchimento.')
    q=dict(id=f'tutoria-semana-01-{n:03}',n=n,questionNumber=n,year='tutoria-semana-01',edition='tutoria-semana-01',text=stem,statement=stem,opts=opts,alternatives=opts,answer=answer,correctAnswer=answer,officialComment=comment,explanation=comment,sourceCommentImported=True,answerStatus='supplied-study-key',answerNote=notice,commentTopic=' › '.join([areas[area][1],topics[n],topics[n]]),source='Tutoria ENAMED · Semana 01 · Caderno do Aluno',tags=['QUESTÕES TUTORIA SEMANAIS','Semana 01',areas[area][1],topics[n]])
    if n in [9,19]: q['answerNote']+=' Esta questão possui ressalva no relatório; consulte o comentário completo.'
    questions.append(q)
    metadata[q['id']]=dict(grandeArea=areas[area][0],subarea=topics[n],tema=topics[n],classificacaoPendente=False,fonte='Área informada no Caderno do Aluno e tema do relatório Semana 01')
assert [q['n'] for q in questions]==list(range(1,21))
(root/'netlify-dist/js/questions-tutoria-semana-01.js').write_text('// Paired source PDFs: original questions and supplied non-official study commentary.\nEXAMS["tutoria-semana-01"] = '+json.dumps(dict(label='QUESTÕES TUTORIA SEMANAIS · Semana 01',questions=questions),ensure_ascii=False,indent=2)+';\n',encoding='utf8')
mf=root/'netlify-dist/js/question-classification.js'
mapping=json.loads(mf.read_text(encoding='utf8').split('const QuestionClassification = ',1)[1].strip().rstrip(';'));mapping.update(metadata)
mf.write_text('// Existing metadata preserved; source taxonomy for imported tutoring questions.\nconst QuestionClassification = '+json.dumps(mapping,ensure_ascii=False,indent=2)+';\n',encoding='utf8')
rf=root/'netlify-dist/data/question-classification-report.json';r=json.loads(rf.read_text(encoding='utf8'))
r['questions']=[row for row in r['questions'] if row.get('edicao')!='tutoria-semana-01']
r['questions'] += [dict(id=q['id'],prova='QUESTÕES TUTORIA SEMANAIS · Semana 01',edicao=q['year'],numero=q['n'],**metadata[q['id']]) for q in questions]
r['total']=len(r['questions']);r['pending']=sum(row['classificacaoPendente'] for row in r['questions']);r['classified']=r['total']-r['pending']
r['distribution']={a:sum(row['grandeArea']==a for row in r['questions']) for a,_ in areas.values()}
rf.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'questions':len(questions),'comments':len(comments),'key':'non-official supplied study key','caveats':[9,19]}))
