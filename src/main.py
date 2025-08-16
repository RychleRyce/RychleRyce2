import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, request
from flask_cors import CORS
from src.models.user import db, User
from src.routes.user import user_bp
from src.routes.order import order_bp

# ========== FLASK APP ==========
app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# CORS
CORS(app)

# Blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(order_bp, url_prefix='/api')

# Database
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB

db.init_app(app)
with app.app_context():
    db.create_all()

# ========== STATIC ROUTES ==========
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    uploads_dir = os.path.join(app.static_folder, 'uploads')
    return send_from_directory(uploads_dir, filename)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

# ========== SENDGRID E-MAIL VERIFICATION ==========
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

sg = SendGridAPIClient(api_key=os.getenv("SENDGRID_API_KEY"))
FROM_EMAIL = os.getenv("FROM_EMAIL", "rychleryce@gmail.com")

def send_verification_email(to_email, token):
    """Odešle ověřovací e-mail přes SendGrid."""
    verify_url = f"https://rychleryce2.onrender.com/api/verify-email/{token}"
    html = f"""
    <h3>Ověřte svůj e-mail</h3>
    <p>Klikněte na odkaz pro dokončení registrace:</p>
    <a href="{verify_url}">{verify_url}</a>
    """
    mail = Mail(
        from_email=FROM_EMAIL,
        to_emails=to_email,
        subject="Potvrďte svůj e-mail – Rychlé Rýče",
        html_content=html
    )
    sg.send(mail)

@app.route('/api/verify-email/<token>')
def verify_email(token):
    user = User.query.filter_by(verification_token=token).first_or_404()
    user.email_verified = True
    user.verification_token = None
    db.session.commit()
    return "<h1>✅ E-mail úspěšně ověřen</h1><p>Můžete se přihlásit.</p>"

# ========== RUN ==========
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
