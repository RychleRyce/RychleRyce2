from flask import Blueprint, jsonify, request, session
from src.models.user import User, db
import json
from datetime import datetime
import secrets
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

user_bp = Blueprint('user', __name__)

# --- SendGrid klient ---
sg = SendGridAPIClient(api_key=os.getenv("SENDGRID_API_KEY"))
FROM_EMAIL = os.getenv("FROM_EMAIL", "rychleryce@gmail.com")

def send_verification_email(user, verification_token):
    """Odešle ověřovací e-mail přes SendGrid."""
    verify_url = f"https://rychleryce2.onrender.com/api/verify-email/{verification_token}"
    html = f"""
    <h3>Ověřte svůj e-mail</h3>
    <p>Klikněte na odkaz pro dokončení registrace:</p>
    <a href="{verify_url}">{verify_url}</a>
    """
    mail = Mail(
        from_email=FROM_EMAIL,
        to_emails=user.email,
        subject="Potvrďte svůj e-mail – Rychlé Rýče",
        html_content=html
    )
    sg.send(mail)

# ---------- REGISTRACE ----------
@user_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    required_fields = ['jmeno', 'prijmeni', 'telefon', 'email', 'password', 'confirm_password', 'role']
    if not all(k in data for k in required_fields):
        return jsonify({'error': 'Chybí povinná pole'}), 400
    if data['password'] != data['confirm_password']:
        return jsonify({'error': 'Hesla se neshodují'}), 400
    if data['role'] not in ['zakaznik', 'brigadnik']:
        return jsonify({'error': 'Neplatná role'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email již existuje'}), 400

    if data['role'] == 'brigadnik':
        brigadnik_fields = ['naradi', 'datum_narozeni', 'volne_dny']
        if not all(k in data for k in brigadnik_fields):
            return jsonify({'error': 'Chybí pole pro brigádníka'}), 400

    user = User(
        jmeno=data['jmeno'],
        prijmeni=data['prijmeni'],
        telefon=data['telefon'],
        email=data['email'],
        role=data['role']
    )
    user.set_password(data['password'])

    if data['role'] == 'brigadnik':
        user.naradi = json.dumps(data['naradi'])
        user.datum_narozeni = datetime.strptime(data['datum_narozeni'], '%Y-%m-%d').date()
        user.volne_dny = json.dumps(data['volne_dny'])
    if data['role'] == 'zakaznik':
        user.potrebuje_pomoc = data.get('potrebuje_pomoc', False)
    if data['role'] == 'admin':
        user.is_approved = True
        user.email_verified = True

    user.verification_token = secrets.token_urlsafe(32)
    db.session.add(user)
    db.session.commit()

    if data['role'] != 'admin':
        send_verification_email(user, user.verification_token)

    return jsonify({
        'message': 'Registrace úspěšná. Zkontrolujte svůj email pro potvrzení.',
        'user_id': user.id
    }), 201

# ---------- OSTATNÍ ROUTY ----------
@user_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    user = User.query.filter_by(verification_token=token).first()
    if not user:
        return jsonify({'error': 'Neplatný verifikační token'}), 400
    if user.verify_email(token):
        db.session.commit()
        return jsonify({'message': 'Email byl úspěšně ověřen'}), 200
    return jsonify({'error': 'Chyba při ověřování'}), 400

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    if not all(k in data for k in ('email', 'password')):
        return jsonify({'error': 'Chybí email nebo heslo'}), 400

    user = User.query.filter_by(email=data['email']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Neplatné údaje'}), 401
    if not user.email_verified:
        return jsonify({'error': 'Email nebyl ověřen'}), 403
    if user.role == 'brigadnik' and not user.is_approved:
        return jsonify({'error': 'Účet čeká na schválení'}), 403

    session['user_id'] = user.id
    session['user_role'] = user.role
    return jsonify({'message': 'Přihlášení úspěšné', 'user': user.to_dict()}), 200

# ---------- zbývající routy (logout, update-profile, admin, ...) ----------
# zde můžeš ponechat všechny další funkce z původního souboru
