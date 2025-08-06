# Instrukce pro nasazení aplikace

## 1. Nahrání na GitHub

### Krok 1: Vytvoření GitHub repository
1. Přihlaste se na GitHub.com
2. Klikněte na "New repository"
3. Název repository: `rychle-ryche-updated`
4. Nastavte jako Public
5. Neklikejte na "Initialize with README" (už máme kód)
6. Klikněte "Create repository"

### Krok 2: Nahrání kódu
V terminálu spusťte následující příkazy (nahraďte YOUR_USERNAME svým GitHub uživatelským jménem):

```bash
cd /home/ubuntu/rychle-ryche/rychle-ryche
git remote add origin https://github.com/YOUR_USERNAME/rychle-ryche-updated.git
git branch -M main
git push -u origin main
```

## 2. Nasazení na Render

### Krok 1: Příprava pro Render
Aplikace je již připravena pro nasazení na Render s následujícími soubory:
- `requirements.txt` - obsahuje všechny potřebné závislosti
- `src/main.py` - hlavní Flask aplikace
- Všechny statické soubory v `src/static/`

### Krok 2: Vytvoření Render služby
1. Přihlaste se na Render.com
2. Klikněte na "New +" → "Web Service"
3. Připojte svůj GitHub účet a vyberte repository `rychle-ryche-updated`
4. Nastavte následující:
   - **Name**: `rychle-ryche-app`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT src.main:app`
   - **Root Directory**: `/` (ponechte prázdné)

### Krok 3: Proměnné prostředí
V sekci "Environment Variables" přidejte:
- `OPENAI_API_KEY`: váš OpenAI API klíč (pro AI analýzu obrázků)
- `FLASK_ENV`: `production`

### Krok 4: Nasazení
1. Klikněte "Create Web Service"
2. Render automaticky nainstaluje závislosti a spustí aplikaci
3. Po dokončení budete mít veřejnou URL pro vaši aplikaci

## 3. Nové funkce aplikace

### Registrace
- **Zákazník**: Jméno, příjmení, telefon, email, heslo + možnost aktivace pomocníka
- **Brigádník**: Základní údaje + výběr nářadí + volné dny + datum narození
- **Email verifikace**: Každý uživatel musí potvrdit email před použitím

### Oprávnění
- **Zákazník**: Zadávání zakázek, hodnocení brigádníků, úprava profilu
- **Brigádník**: Přebírání zakázek, hodnocení zákazníků, úprava cen
- **Admin**: Kompletní přístup, schvalování brigádníků, statistiky

### Zakázky
- **Mapa**: Výběr adresy na mapě nebo ruční zadání
- **AI analýza**: Automatické hodnocení nahrané fotky a odhad ceny
- **Platby**: 1/3 předem, zbytek po dokončení
- **Hodnocení**: Oboustranné hodnocení po dokončení

### UI/UX vylepšení
- **Profesionální design**: Moderní, čistý vzhled
- **Avatary**: Různé avatary pro typy prací (sekání, stříhání, natírání, atd.)
- **Accessibility**: Zvětšení písma, vysoký kontrast, keyboard navigation
- **Pomocník**: AI avatar pro zákazníky, kteří potřebují pomoc

### Admin funkce
- **Dashboard**: Statistiky, přehledy
- **Schvalování**: Brigádníci musí být schváleni před prací
- **Správa**: Kickování uživatelů, přístup ke všem datům

## 4. Testovací údaje

### Admin přihlášení
- **Email**: rychleryce@gmail.com
- **Heslo**: Zahradnykralchemik16?

## 5. Technické detaily

### Struktura projektu
```
src/
├── main.py              # Hlavní Flask aplikace
├── models/
│   └── user.py          # Databázové modely
├── routes/
│   ├── user.py          # Uživatelské routes
│   └── order.py         # Zakázkové routes
├── static/
│   ├── index.html       # Hlavní HTML
│   ├── style.css        # CSS styly
│   ├── script.js        # JavaScript
│   └── avatar-*.png     # Avatar obrázky
└── database/
    └── app.db           # SQLite databáze
```

### Závislosti
- Flask 3.1.1 - webový framework
- Flask-SQLAlchemy 3.1.1 - ORM pro databázi
- Flask-CORS 6.0.0 - CORS podpora
- OpenAI 1.98.0 - AI analýza obrázků
- Pillow 10.4.0 - zpracování obrázků
- Gunicorn 23.0.0 - production server

### Databáze
Aplikace používá SQLite databázi s následujícími tabulkami:
- `users` - uživatelé (zákazníci, brigádníci, admin)
- `orders` - zakázky
- `ratings` - hodnocení

Databáze se automaticky vytvoří při prvním spuštění aplikace.

## 6. Řešení problémů

### Časté problémy
1. **Chyba při instalaci závislostí**: Zkontrolujte Python verzi (3.8+)
2. **Databázové chyby**: Smažte `src/database/app.db` a restartujte aplikaci
3. **CORS chyby**: Zkontrolujte Flask-CORS konfiguraci
4. **OpenAI chyby**: Ověřte API klíč v proměnných prostředí

### Logy
Pro debugging zkontrolujte logy na Render dashboard v sekci "Logs".

## 7. Budoucí vylepšení

### Možná rozšíření
- Mobilní aplikace
- Push notifikace
- Pokročilé filtrování zakázek
- Kalendářní integrace
- Platební brána (Stripe/PayPal)
- Více jazyků
- Pokročilé AI funkce

Aplikace je nyní připravena pro produkční nasazení s všemi požadovanými funkcemi!

