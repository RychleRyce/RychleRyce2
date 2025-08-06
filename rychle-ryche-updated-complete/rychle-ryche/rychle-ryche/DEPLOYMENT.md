# Instrukce pro nasazení aplikace Rychlé Rýče

## 🚀 Nasazení na Render.com (Doporučeno)

### Krok 1: Příprava kódu
1. Nahrajte celý projekt na GitHub repository
2. Ujistěte se, že `requirements.txt` obsahuje všechny závislosti:
   ```
   Flask==3.1.1
   Flask-CORS==6.0.0
   Flask-SQLAlchemy==3.1.1
   Werkzeug==3.1.3
   ```

### Krok 2: Vytvoření Web Service
1. Přihlaste se na [render.com](https://render.com)
2. Klikněte na "New +" → "Web Service"
3. Připojte váš GitHub repository
4. Nastavte následující:
   - **Name**: `rychle-ryche`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python src/main.py`
   - **Instance Type**: `Free` (pro testování)

### Krok 3: Proměnné prostředí
V sekci "Environment Variables" přidejte:
- `PYTHON_VERSION`: `3.11.0`
- `SECRET_KEY`: `váš-silný-náhodný-klíč`

### Krok 4: Deploy
1. Klikněte "Create Web Service"
2. Čekejte na dokončení buildu (5-10 minut)
3. Aplikace bude dostupná na `https://rychle-ryche.onrender.com`

## 🌐 Nasazení na Vercel

### Krok 1: Příprava projektu
Vytvořte `vercel.json` v root složce:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/main.py"
    }
  ]
}
```

### Krok 2: Deploy
```bash
npm i -g vercel
vercel login
vercel --prod
```

## 🐳 Nasazení pomocí Docker

### Dockerfile
Vytvořte `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "src/main.py"]
```

### Docker Compose
Vytvořte `docker-compose.yml`:
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - ./src/database:/app/src/database
      - ./src/static/uploads:/app/src/static/uploads
```

### Spuštění
```bash
docker-compose up -d
```

## ☁️ Nasazení na Heroku

### Krok 1: Příprava
Vytvořte `Procfile`:
```
web: python src/main.py
```

### Krok 2: Deploy
```bash
heroku create rychle-ryche
git push heroku main
```

## 🔧 Konfigurace pro produkci

### 1. Bezpečnost
V `src/main.py` změňte:
```python
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'fallback-key')
```

### 2. Databáze
Pro produkci použijte PostgreSQL:
```python
import os
if os.environ.get('DATABASE_URL'):
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
```

### 3. CORS
Omezte CORS na vaši doménu:
```python
CORS(app, origins=['https://yourdomain.com'])
```

### 4. Logging
Přidejte logging:
```python
import logging
if not app.debug:
    logging.basicConfig(level=logging.INFO)
```

## 📊 Monitoring a údržba

### 1. Health Check
Přidejte endpoint pro health check:
```python
@app.route('/health')
def health():
    return {'status': 'healthy'}, 200
```

### 2. Backup databáze
Pro SQLite:
```bash
cp src/database/app.db backup/app_$(date +%Y%m%d_%H%M%S).db
```

### 3. Monitoring chyb
Doporučujeme integraci se službami jako:
- Sentry
- Rollbar
- Bugsnag

## 🔄 Aktualizace aplikace

### 1. Lokální testování
```bash
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
python src/main.py
```

### 2. Deploy na Render
- Push změny na GitHub
- Render automaticky redeployuje

### 3. Migrace databáze
Při změnách schématu:
```bash
# Backup současné databáze
cp src/database/app.db backup/
# Smazání pro nové schéma
rm src/database/app.db
# Restart aplikace
```

## 🚨 Troubleshooting

### Časté problémy:

1. **Build fails na Render**
   - Zkontrolujte `requirements.txt`
   - Ujistěte se, že Python verze je kompatibilní

2. **Databáze chyby**
   - Smažte `app.db` a nechte vytvořit novou
   - Zkontrolujte oprávnění k zápisu

3. **Upload obrázků nefunguje**
   - Zkontrolujte, že složka `uploads` existuje
   - Ověřte oprávnění k zápisu

4. **CORS chyby**
   - Zkontrolujte nastavení CORS
   - Ověřte, že frontend volá správné URL

### Logy a debugging:
```bash
# Render logs
render logs --service-id your-service-id

# Lokální debugging
export FLASK_DEBUG=1
python src/main.py
```

## 📞 Podpora

Pro technické problémy:
1. Zkontrolujte logy aplikace
2. Ověřte konfiguraci
3. Kontaktujte vývojáře s detaily chyby

---

**Úspěšné nasazení!** 🎉

