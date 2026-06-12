import { NextResponse } from 'next/server'

const TEMPLATE_CSV = `Player Name,Primary Role,Current Club,Club Location Country,Year of Birth,Instagram Link,Transfermarkt Link,Notes,Secondary Nation,Tertiary Nation,Fourth Nation,Fifth Nation
Achraf Hakimi,Right-Back,Paris Saint-Germain,France,1998,https://instagram.com/achrafh8,https://www.transfermarkt.com/achraf-hakimi/profil/spieler/317045,,Morocco,Spain,,
Bukayo Saka,Right Winger,Arsenal,England,2001,https://instagram.com/bukayosaka87,https://www.transfermarkt.com/bukayo-saka/profil/spieler/418774,,Nigeria,,,
Alphonso Davies,Left-Back,Bayern Munich,Germany,2000,https://instagram.com/alphonsodavies,https://www.transfermarkt.com/alphonso-davies/profil/spieler/485631,,Canada,Liberia,,
Lamine Yamal,Right Winger,Barcelona,Spain,2007,https://instagram.com/lamineyamal19,,,Morocco,Equatorial Guinea,,
`

export async function GET() {
  return new NextResponse(TEMPLATE_CSV, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="futlegionnaires-import-template.csv"',
    },
  })
}
