from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import secrets

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # Základní údaje
    jmeno = db.Column(db.String(80), nullable=False)
    prijmeni = db.Column(db.String(80), nullable=False)
    telefon = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'zakaznik', 'brigadnik', 'admin'
    
    # Email verifikace
    email_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(100), nullable=True)
    
    # Schvalování brigádníků
    is_approved = db.Column(db.Boolean, default=False)
    
    # Specifické údaje pro brigádníky
    naradi = db.Column(db.Text, nullable=True)  # Seznam nářadí (JSON string)
    datum_narozeni = db.Column(db.Date, nullable=True)
    volne_dny = db.Column(db.Text, nullable=True)  # Volné dny (JSON string)
    
    # Nastavení zákazníka
    potrebuje_pomoc = db.Column(db.Boolean, default=False)  # "Moc tomu nerozumím"
    
    # Časové značky
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Vztahy
    orders = db.relationship('Order', backref='customer', lazy=True, foreign_keys='Order.customer_id')
    taken_orders = db.relationship('Order', backref='worker', lazy=True, foreign_keys='Order.worker_id')
    customer_ratings = db.relationship('Rating', backref='rated_customer', lazy=True, foreign_keys='Rating.customer_id')
    worker_ratings = db.relationship('Rating', backref='rated_worker', lazy=True, foreign_keys='Rating.worker_id')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def generate_verification_token(self):
        self.verification_token = secrets.token_urlsafe(32)
        return self.verification_token
    
    def verify_email(self, token):
        if self.verification_token == token:
            self.email_verified = True
            self.verification_token = None
            return True
        return False

    def __repr__(self):
        return f'<User {self.jmeno} {self.prijmeni}>'

    def to_dict(self):
        return {
            'id': self.id,
            'jmeno': self.jmeno,
            'prijmeni': self.prijmeni,
            'telefon': self.telefon,
            'email': self.email,
            'role': self.role,
            'email_verified': self.email_verified,
            'is_approved': self.is_approved,
            'naradi': self.naradi,
            'datum_narozeni': self.datum_narozeni.isoformat() if self.datum_narozeni else None,
            'volne_dny': self.volne_dny,
            'potrebuje_pomoc': self.potrebuje_pomoc,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    adresa = db.Column(db.String(500), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    photo_filename = db.Column(db.String(255), nullable=True)
    ai_analysis = db.Column(db.Text, nullable=True)  # AI analýza obrázku
    ma_vse_potrebne = db.Column(db.Boolean, default=False)  # Má zákazník vše potřebné
    estimated_price = db.Column(db.Float, nullable=True)  # Odhadovaná cena
    final_price = db.Column(db.Float, nullable=True)  # Finální cena
    status = db.Column(db.String(20), default='open')  # 'open', 'taken', 'completed', 'paid'
    payment_status = db.Column(db.String(20), default='pending')  # 'pending', 'partial', 'completed'
    customer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    worker_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    taken_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f'<Order {self.title}>'

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'adresa': self.adresa,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'photo_filename': self.photo_filename,
            'ai_analysis': self.ai_analysis,
            'ma_vse_potrebne': self.ma_vse_potrebne,
            'estimated_price': self.estimated_price,
            'final_price': self.final_price,
            'status': self.status,
            'payment_status': self.payment_status,
            'customer_id': self.customer_id,
            'worker_id': self.worker_id,
            'customer_name': f"{self.customer.jmeno} {self.customer.prijmeni}" if self.customer else None,
            'worker_name': f"{self.worker.jmeno} {self.worker.prijmeni}" if self.worker else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'taken_at': self.taken_at.isoformat() if self.taken_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

class Rating(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    worker_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    customer_rating = db.Column(db.Integer, nullable=True)  # Hodnocení zákazníka (1-5)
    worker_rating = db.Column(db.Integer, nullable=True)  # Hodnocení brigádníka (1-5)
    customer_comment = db.Column(db.Text, nullable=True)
    worker_comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    order = db.relationship('Order', backref='ratings')

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'customer_id': self.customer_id,
            'worker_id': self.worker_id,
            'customer_rating': self.customer_rating,
            'worker_rating': self.worker_rating,
            'customer_comment': self.customer_comment,
            'worker_comment': self.worker_comment,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

