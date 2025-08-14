from flask import Blueprint, jsonify, request, session, url_for
from src.models.user import User, db
import json
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

user_bp = Blueprint('user', __name__)

def send_verification_email(user, verification_token):
    """Odeslání verifikačního emailu (simulace - v produkci by se použil skutečný SMTP)"""
    # V produkci by zde byl skutečný SMTP server
    print(f"SIMULACE: Verifikační email pro {user.email}")
    print(f"Verifikační odkaz: /api/verify-email/{verification_token}")
    return True

@user_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    
    # Kontrola povinných polí podle role
    required_fields = ['jmeno', 'prijmeni', 'telefon', 'email', 'password', 'confirm_password', 'role']
    
    if not all(k in data for k in required_fields):
        return jsonify({'error': 'Chybí povinná pole'}), 400
    
    # Kontrola shody hesel
    if data['password'] != data['confirm_password']:
        return jsonify({'error': 'Hesla se neshodují'}), 400
    
    # Kontrola role
    if data['role'] not in ['zakaznik', 'brigadnik']:
        return jsonify({'error': 'Neplatná role'}), 400
    
    # Kontrola, zda uživatel již neexistuje
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email již existuje'}), 400
    
    # Specifické kontroly pro brigádníky
    if data['role'] == 'brigadnik':
        brigadnik_fields = ['naradi', 'datum_narozeni', 'volne_dny']
        if not all(k in data for k in brigadnik_fields):
            return jsonify({'error': 'Chybí povinná pole pro brigádníka'}), 400
    
    # Vytvoření nového uživatele
    user = User(
        jmeno=data['jmeno'],
        prijmeni=data['prijmeni'],
        telefon=data['telefon'],
        email=data['email'],
        role=data['role']
    )
    user.set_password(data['password'])
    
    # Generování verifikačního tokenu
    verification_token = user.generate_verification_token()
    
    # Specifické údaje pro brigádníky
    if data['role'] == 'brigadnik':
        user.naradi = json.dumps(data['naradi']) if isinstance(data['naradi'], list) else data['naradi']
        try:
            user.datum_narozeni = datetime.strptime(data['datum_narozeni'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Neplatný formát data narození (YYYY-MM-DD)'}), 400
        user.volne_dny = json.dumps(data['volne_dny']) if isinstance(data['volne_dny'], list) else data['volne_dny']
    
    # Nastavení pro zákazníky
    if data['role'] == 'zakaznik':
        user.potrebuje_pomoc = data.get('potrebuje_pomoc', False)
    
    # Admini jsou automaticky schváleni a verifikováni
    if data['role'] == 'admin':
        user.is_approved = True
        user.email_verified = True
    
    db.session.add(user)
    db.session.commit()
    
    # Odeslání verifikačního emailu
    if data['role'] != 'admin':
        send_verification_email(user, verification_token)
    
    return jsonify({
        'message': 'Registrace úspěšná. Zkontrolujte svůj email pro potvrzení.',
        'user_id': user.id,
        'email_verification_required': True
    }), 201

@user_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    user = User.query.filter_by(verification_token=token).first()
    
    if not user:
        return jsonify({'error': 'Neplatný verifikační token'}), 400
    
    if user.verify_email(token):
        db.session.commit()
        return jsonify({'message': 'Email byl úspěšně ověřen. Nyní se můžete přihlásit.'}), 200
    else:
        return jsonify({'error': 'Chyba při ověřování emailu'}), 400

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    
    if not all(k in data for k in ('email', 'password')):
        return jsonify({'error': 'Chybí email nebo heslo'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Neplatné přihlašovací údaje'}), 401
    
    # Kontrola ověření emailu
    if not user.email_verified:
        return jsonify({'error': 'Email nebyl ověřen. Zkontrolujte svou emailovou schránku.'}), 403
    
    # Kontrola schválení brigádníka
    if user.role == 'brigadnik' and not user.is_approved:
        return jsonify({'error': 'Váš účet brigádníka ještě nebyl schválen administrátorem.'}), 403
    
    session['user_id'] = user.id
    session['user_role'] = user.role
    return jsonify({
        'message': 'Přihlášení úspěšné',
        'user': user.to_dict()
    }), 200

@user_bp.route('/login-admin', methods=['POST'])
def login_admin():
    data = request.json
    
    # Pevně zadané admin údaje
    admin_email = "rychleryce@gmail.com"
    admin_password = "Zahradnykralchemik16?"
    
    if data.get('email') != admin_email or data.get('password') != admin_password:
        return jsonify({'error': 'Neplatné admin přihlašovací údaje'}), 401
    
    # Najít nebo vytvořit admin účet
    admin_user = User.query.filter_by(email=admin_email).first()
    if not admin_user:
        admin_user = User(
            jmeno="Admin",
            prijmeni="Rychlé Rýče",
            telefon="000000000",
            email=admin_email,
            role="admin",
            email_verified=True,
            is_approved=True
        )
        admin_user.set_password(admin_password)
        db.session.add(admin_user)
        db.session.commit()
    
    session['user_id'] = admin_user.id
    session['user_role'] = admin_user.role
    return jsonify({
        'message': 'Admin přihlášení úspěšné',
        'user': admin_user.to_dict()
    }), 200

@user_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Odhlášení úspěšné'}), 200

@user_bp.route('/current-user', methods=['GET'])
def current_user():
    if 'user_id' not in session:
        return jsonify({'error': 'Nepřihlášen'}), 401
    
    user = User.query.get(session['user_id'])
    if not user:
        session.clear()
        return jsonify({'error': 'Uživatel nenalezen'}), 404
    
    return jsonify({'user': user.to_dict()}), 200

@user_bp.route('/update-profile', methods=['PUT'])
def update_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Nepřihlášen'}), 401
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'Uživatel nenalezen'}), 404
    
    data = request.json
    
    # Aktualizace základních údajů
    if 'jmeno' in data:
        user.jmeno = data['jmeno']
    if 'prijmeni' in data:
        user.prijmeni = data['prijmeni']
    if 'telefon' in data:
        user.telefon = data['telefon']
    
    # Aktualizace specifických údajů podle role
    if user.role == 'brigadnik':
        if 'naradi' in data:
            user.naradi = json.dumps(data['naradi']) if isinstance(data['naradi'], list) else data['naradi']
        if 'volne_dny' in data:
            user.volne_dny = json.dumps(data['volne_dny']) if isinstance(data['volne_dny'], list) else data['volne_dny']
    
    if user.role == 'zakaznik':
        if 'potrebuje_pomoc' in data:
            user.potrebuje_pomoc = data['potrebuje_pomoc']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profil aktualizován',
        'user': user.to_dict()
    }), 200

@user_bp.route('/brigadnici', methods=['GET'])
def get_brigadnici():
    # Pouze pro administrátory
    if 'user_id' not in session:
        return jsonify({'error': 'Nepřihlášen'}), 401
    
    current_user = User.query.get(session['user_id'])
    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Nedostatečná oprávnění'}), 403
    
    brigadnici = User.query.filter_by(role='brigadnik').all()
    return jsonify([user.to_dict() for user in brigadnici])

@user_bp.route('/approve-brigadnik/<int:user_id>', methods=['POST'])
def approve_brigadnik(user_id):
    # Pouze pro administrátory
    if 'user_id' not in session:
        return jsonify({'error': 'Nepřihlášen'}), 401
    
    current_user = User.query.get(session['user_id'])
    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Nedostatečná oprávnění'}), 403
    
    user = User.query.get_or_404(user_id)
    
    if user.role != 'brigadnik':
        return jsonify({'error': 'Uživatel není brigádník'}), 400
    
    user.is_approved = True
    db.session.commit()
    
    return jsonify({
        'message': 'Brigádník schválen',
        'user': user.to_dict()
    }), 200

@user_bp.route('/users', methods=['GET'])
def get_users():
    # Pouze pro administrátory
    if 'user_id' not in session:
        return jsonify({'error': 'Nepřihlášen'}), 401
    
    current_user = User.query.get(session['user_id'])
    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Nedostatečná oprávnění'}), 403
    
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    # Pouze pro administrátory nebo vlastní profil
    if 'user_id' not in session:
        return jsonify({'error': 'Nepřihlášen'}), 401
    
    current_user = User.query.get(session['user_id'])
    if not current_user:
        return jsonify({'error': 'Uživatel nenalezen'}), 404
    
    if current_user.role != 'admin' and current_user.id != user_id:
        return jsonify({'error': 'Nedostatečná oprávnění'}), 403
    
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    # Pouze pro administrátory
    if 'user_id' not in session:
        return jsonify({'error': 'Nepřihlášen'}), 401
    
    current_user = User.query.get(session['user_id'])
    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Nedostatečná oprávnění'}), 403
    
    user = User.query.get_or_404(user_id)
    
    # Nelze smazat sebe sama
    if user.id == current_user.id:
        return jsonify({'error': 'Nelze smazat vlastní účet'}), 400
    
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Uživatel smazán'}), 200

@user_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    data = request.json
    
    if 'email' not in data:
        return jsonify({'error': 'Chybí email'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user:
        return jsonify({'error': 'Uživatel s tímto emailem neexistuje'}), 404
    
    if user.email_verified:
        return jsonify({'error': 'Email je již ověřen'}), 400
    
    # Generování nového verifikačního tokenu
    verification_token = user.generate_verification_token()
    db.session.commit()
    
    # Odeslání verifikačního emailu
    send_verification_email(user, verification_token)
    
    return jsonify({'message': 'Verifikační email byl znovu odeslán'}), 200
    email_verified = db.Column(db.Boolean, default=False)
email_token = db.Column(db.String(255), nullable=True)

