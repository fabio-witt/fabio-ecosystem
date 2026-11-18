from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from pypdf import PdfReader

out='output/pdf/Motivationsschreiben_Fabio_Witt_Goodyear_Franchise_Operations_Analyst.pdf'
pdfmetrics.registerFont(TTFont('Arial','/System/Library/Fonts/Supplemental/Arial.ttf'))
pdfmetrics.registerFont(TTFont('ArialBold','/System/Library/Fonts/Supplemental/Arial Bold.ttf'))
c=canvas.Canvas(out,pagesize=A4)
c.setTitle('Motivationsschreiben - Fabio Witt - Goodyear Suisse SA')
c.setAuthor('Fabio Witt')
w,h=A4
left=58
c.setFillColor(HexColor('#203248'))
c.setFont('ArialBold',20)
c.drawString(left,h-66,'Fabio Witt')
c.setStrokeColor(HexColor('#CBD2D9'))
c.line(left,h-82,w-left,h-82)
c.setFillColor(HexColor('#20252B'))
c.setFont('Arial',11)
c.drawString(left,h-118,'Goodyear Suisse SA')
c.drawString(left,h-134,'Personalabteilung | Volketswil')
c.setFont('Arial',10)
c.drawRightString(w-left,h-170,'18. November 2026')
style=ParagraphStyle('body',fontName='Arial',fontSize=11,leading=16,spaceAfter=12,textColor=HexColor('#20252B'))
subject=ParagraphStyle('subject',parent=style,fontName='ArialBold',fontSize=12,leading=17)
y=h-205
p=Paragraph('Bewerbung als Franchise Operations Analyst<br/>Referenz: JR-40113791',subject)
_,ph=p.wrap(w-2*left,100)
p.drawOn(c,left,y-ph)
y-=ph+23
paragraphs=[
'Sehr geehrte Damen und Herren',
'die Position als Franchise Operations Analyst in Volketswil verbindet das Goodyear-Retail-Umfeld, das ich bereits gut kenne, mit neuen fachlichen Aufgaben. Nach meinem Umzug in die Schweiz möchte ich meine Erfahrung gerne wieder bei Goodyear einbringen und dort weiterarbeiten, wo meine berufliche Laufbahn begonnen hat.',
'Von 2020 bis 2023 war ich bei der GDHS in Köln tätig, die heute Goodyear Retail Systems (GRS) heisst. Im IT Retail Team unter Marco Heitmann sammelte ich meine erste Berufserfahrung. Ich habe mich engagiert in die gemeinsame Arbeit eingebracht und verbinde mit dieser Zeit einen gelungenen Einstieg in mein Berufsleben.',
'Während dieser drei Jahre habe ich intensiv mit Tyresoft gearbeitet und kenne das System sehr gut. Meine Systemkenntnisse und meine Vertrautheit mit dem Retail-Umfeld von Goodyear sehe ich als gute Grundlage für die ausgeschriebene Rolle. Besonders interessiert mich die Verbindung zwischen verlässlichen Daten, funktionierenden Systemen und der operativen Unterstützung der Franchisepartner.',
'Die Aufgaben rund um Stammdatenqualität, Auswertungen und die Koordination zwischen verschiedenen Ansprechpartnern sprechen mich besonders an. Ich möchte meine bisherige IT-Perspektive in diese Schnittstellenfunktion einbringen und mich gezielt in die weiterführenden Themen des Franchise-Geschäfts, des Reportings und der Planung einarbeiten.',
'Eine Rückkehr zu Goodyear in meinem neuen Lebensmittelpunkt Schweiz wäre für mich fachlich und persönlich ein wertvoller nächster Schritt. Gerne können Sie sich nach Absprache bei Marco Heitmann oder im IT Retail Team in Köln über meine damalige Tätigkeit und Zusammenarbeit erkundigen.',
'Ich freue mich über die Gelegenheit, Ihnen meine Motivation in einem persönlichen Gespräch näherzubringen und gemeinsam zu besprechen, wie ich Ihr Team in Volketswil unterstützen kann.',
'Freundliche Grüsse',
'Fabio Witt'
]
for text in paragraphs:
 p=Paragraph(text,style)
 _,ph=p.wrap(w-2*left,700)
 p.drawOn(c,left,y-ph)
 y-=ph+12
assert y>45,y
c.save()
r=PdfReader(out)
assert len(r.pages)==1
text=r.pages[0].extract_text()
assert all(s in text for s in ['2020','2023','Tyresoft','Marco Heitmann','Goodyear Suisse'])
print(out)
print('Verified: one page; required details present; bottom position:',round(y))
