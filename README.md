# Rychlé Rýče - Zahradní služby 🌿

Moderní webová aplikace pro spojování zákazníků s brigádníky pro zahradní práce. Aplikace využívá AI pro analýzu obrázků a automatický odhad cen, obsahuje pokročilé uživatelské role a accessibility funkce.

## ✨ Nové funkce

### 🔐 Rozšířená registrace a autentifikace
- **Email verifikace**: Povinné potvrzení emailu před použitím aplikace
- **Zákazník**: Jméno, příjmení, telefon, email, heslo + možnost aktivace pomocníka
- **Brigádník**: Základní údaje + výběr nářadí + volné dny + datum narození
- **Admin přístup**: Speciální přihlášení pro administrátory

### 👥 Uživatelské role a oprávnění
- **Zákazník**: Zadávání zakázek, hodnocení brigádníků, úprava profilu
- **Brigádník**: Přebírání zakázek, hodnocení zákazníků, úprava cen, musí být schválen adminem
- **Admin**: Kompletní přístup, schvalování brigádníků, statistiky, správa uživatelů

### 📋 Pokročilý systém zakázek
- **Mapa integrace**: Výběr adresy na interaktivní mapě nebo ruční zadání
- **AI analýza obrázků**: Automatické hodnocení nahrané fotky a odhad ceny pomocí OpenAI
- **Uložené adresy**: Zákazníci si mohou uložit často používané adresy
- **Platební systém**: 1/3 platba předem, zbytek po dokončení
- **Oboustranné hodnocení**: Zákazníci i brigádníci se hodnotí navzájem

### 🎨 Moderní UI/UX design
- **Profesionální vzhled**: Čistý, moderní design s gradientními pozadími
- **Avatary pro práce**: Specializované avatary pro různé typy zahradních prací
- **Responsivní design**: Optimalizováno pro desktop i mobilní zařízení
- **Animace a přechody**: Plynulé animace pro lepší uživatelský zážitek

### ♿ Accessibility funkce
- **Zvětšení písma**: Možnost zvětšit písmo pro seniory
- **Vysoký kontrast**: Režim pro uživatele se zrakovým postižením
- **Keyboard navigation**: Plná podpora navigace klávesnicí
- **Screen reader podpora**: ARIA labely a semantic HTML
- **Skip links**: Rychlá navigace pro uživatele s postižením

### 🤖 AI pomocník
- **Kontextová nápověda**: Inteligentní rady na základě aktuální činnosti
- **Detekce typu práce**: Automatické rozpoznání typu práce z popisu
- **Specializované avatary**: Různé avatary podle typu práce
- **Aktivace pro začátečníky**: Možnost zapnout pomocníka při registraci

### 📊 Admin dashboard
- **Statistiky**: Přehled zakázek, tržeb, úspěšnosti
- **Schvalování brigádníků**: Kontrola a schvalování nových brigádníků
- **Správa uživatelů**: Možnost kickovat problematické uživatele
- **Kompletní přístup**: Přístup ke všem datům a funkcím

## 🚀 Technologie

- **Backend**: Flask 3.1.1, SQLAlchemy, Flask-CORS
- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **AI**: OpenAI GPT-4 Vision pro analýzu obrázků
- **Mapy**: Leaflet.js pro interaktivní mapy
- **Databáze**: SQLite (development), PostgreSQL (production)
- **Deployment**: Render.com, Gunicorn

## 📦 Instalace

### Lokální vývoj

1. **Klonování repository**
```bash
git clone https://github.com/YOUR_USERNAME/rychle-ryche-updated.git
cd rychle-ryche-updated
```

2. **Instalace závislostí**
```bash
pip install -r requirements.txt
```

3. **Nastavení proměnných prostředí**
```bash
export OPENAI_API_KEY="your-openai-api-key"
export FLASK_ENV="development"
```

4. **Spuštění aplikace**
```bash
python src/main.py
```

Aplikace bude dostupná na `http://localhost:5000`

### Production nasazení

Viz [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md) pro detailní instrukce.

## 🎯 Použití

### Pro zákazníky
1. Registrace s email verifikací
2. Vytvoření zakázky s popisem a fotkou
3. Výběr adresy na mapě
4. AI automaticky odhadne cenu
5. Čekání na brigádníka
6. Platba 1/3 při přijetí zakázky
7. Dokončení a hodnocení

### Pro brigádníky
1. Registrace s výběrem nářadí a volných dnů
2. Čekání na schválení adminem
3. Prohlížení dostupných zakázek
4. Přijetí zakázky
5. Možnost úpravy ceny
6. Označení dokončení
7. Hodnocení zákazníka

### Pro administrátory
1. Přihlášení admin účtem
2. Přehled statistik
3. Schvalování brigádníků
4. Správa uživatelů
5. Monitoring systému

## 🔧 API Endpoints

### Uživatelé
- `POST /register` - Registrace uživatele
- `POST /verify-email` - Verifikace emailu
- `POST /login` - Přihlášení
- `POST /admin-login` - Admin přihlášení
- `GET /profile` - Profil uživatele
- `PUT /profile` - Aktualizace profilu

### Zakázky
- `POST /orders` - Vytvoření zakázky
- `GET /orders` - Seznam zakázek
- `PUT /orders/<id>/take` - Přijetí zakázky
- `PUT /orders/<id>/complete` - Dokončení zakázky
- `POST /orders/<id>/rate` - Hodnocení
- `POST /analyze-image` - AI analýza obrázku

### Admin
- `GET /admin/stats` - Statistiky
- `GET /admin/users` - Seznam uživatelů
- `PUT /admin/users/<id>/approve` - Schválení brigádníka
- `DELETE /admin/users/<id>` - Smazání uživatele

## 🎨 Avatary a ikony

Aplikace obsahuje specializované avatary pro různé typy prací:
- 🌱 **Sekání trávy** - Avatar s sekačkou
- ✂️ **Stříhání keřů** - Avatar se stříhačem
- 🎨 **Natírání** - Avatar s barvou a štětcem
- 🌿 **Obecné zahradní práce** - Avatar s různým nářadím
- 🤖 **AI pomocník** - Robot avatar pro nápovědu

## 🔒 Bezpečnost

- Hashování hesel pomocí Werkzeug
- CORS konfigurace pro bezpečné API volání
- Validace vstupů na frontend i backend
- Email verifikace pro všechny účty
- Admin schvalování brigádníků

## 📱 Responsivní design

Aplikace je plně optimalizována pro:
- **Desktop** - Plná funkcionalita s velkými obrazovkami
- **Tablet** - Přizpůsobené rozložení pro střední obrazovky
- **Mobil** - Mobilní menu a touch-friendly ovládání

## ♿ Přístupnost

- **WCAG 2.1 AA** kompatibilní
- **Screen reader** podpora
- **Keyboard navigation** pro všechny funkce
- **High contrast** režim
- **Zvětšení písma** pro seniory
- **Skip links** pro rychlou navigaci

## 🧪 Testování

### Testovací účty

**Admin:**
- Email: rychleryce@gmail.com
- Heslo: Zahradnykralchemik16?

### Testovací scénáře
1. Registrace zákazníka s pomocníkem
2. Registrace brigádníka s nářadím
3. Vytvoření zakázky s AI analýzou
4. Admin schválení brigádníka
5. Přijetí a dokončení zakázky
6. Oboustranné hodnocení

## 🐛 Řešení problémů

### Časté problémy
- **Databázové chyby**: Smažte `src/database/app.db` a restartujte
- **OpenAI chyby**: Zkontrolujte API klíč
- **CORS chyby**: Ověřte Flask-CORS konfiguraci
- **Email verifikace**: Zkontrolujte spam složku

## 🤝 Přispívání

1. Fork repository
2. Vytvořte feature branch (`git checkout -b feature/nova-funkce`)
3. Commit změny (`git commit -am 'Přidání nové funkce'`)
4. Push do branch (`git push origin feature/nova-funkce`)
5. Vytvořte Pull Request

## 📄 Licence

Tento projekt je licencován pod MIT licencí - viz [LICENSE](LICENSE) soubor pro detaily.

## 📞 Kontakt

- **Email**: rychleryce@gmail.com
- **GitHub**: [Repository](https://github.com/YOUR_USERNAME/rychle-ryche-updated)

## 🙏 Poděkování

- OpenAI za GPT-4 Vision API
- Leaflet.js za mapové funkce
- Font Awesome za ikony
- Všem beta testerům

---

**Rychlé Rýče** - Moderní řešení pro zahradní služby s AI podporou! 🌿✨

