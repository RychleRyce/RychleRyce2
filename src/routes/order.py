from flask import Blueprint, jsonify, request, session
from src.models.user import User, Order, Rating, db
from werkzeug.utils import secure_filename
import os
import json
from datetime import datetime
import openai
import base64

order_bp = Blueprint('order', __name__)

UPLOAD_FOLDER = 'src/static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def analyze_image_with_ai(image_path):
    """Analýza obrázku pomocí OpenAI Vision API"""
    try:
        with open(image_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')
        
        client = openai.OpenAI()
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Analyzuj tento obrázek zahradní práce. Popiš co vidíš, jaký typ práce je potřeba, odhadni obtížnost a dobu trvání. Odpověz v češtině."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=300
        )
        
        return response.choices[0].message.content
    except Exception as e:
        return f"Chyba při analýze obrázku: {str(e)}"

def estimate_price(description, ai_analysis):
    """Odhad ceny na základě popisu a AI analýzy"""
    try:
        client = openai.OpenAI()
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": f"""Na základě následujícího popisu práce a AI analýzy obrázku odhadni cenu v českých korunách.
                    
Popis práce: {description}
AI analýza: {ai_analysis}

Odpověz pouze číslem (cena v Kč) bez dalšího textu. Zohledni běžné ceny zahradních prací v ČR."""
                }
            ],
            max_tokens=50
        )
        
        price_text = response.choices[0].message.content.strip()
        # Extrakce čísla z odpovědi
        import re
        price_match = re.search(r'\d+', price_text)
        if price_match:
            return float(price_match.group())
        else:
            return 500.0  # Výchozí cena
    except Exception as e:
        return 500.0  # Výchozí cena při chybě

@order_bp.route('/orders', methods=['POST'])
def create_order():
    if 'user_id' not in session:
        return jsonify({'error': 'Nepřihlášen'}), 401
    
    user = User.query.get(session['user_id'])
    if user.role != 'zakaznik':
        return jsonify({'error': 'Pouze zákazníci mohou vytvářet zakázky'}), 403
    
    data = request.form
    
    required_fields = ['title', 'description', 'adresa']
    if not all(k in data for k in required_fields):
        return jsonify({'error': 'Chybí povinná pole'}), 400
    
    # Zpracování nahrané fotky
    photo_filename = None
    ai_analysis = None
    
    if 'photo' in request.files:
        file = request.files['photo']
        if file and file.filename != '' and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Přidání timestamp pro jedinečnost
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
            filename = timestamp + filename
            
            # Vytvoření upload složky pokud neexistuje
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            photo_filename = filename
            
            # AI analýza obrázku
            ai_analysis = analyze_image_with_ai(file_path)
    
    # Odhad ceny pomocí AI
    estimated_price = estimate_price(data['description'], ai_analysis or "Bez obrázku")
    
    # Vytvoření zakázky
    order = Order(
        title=data['title'],
        description=data['description'],
        adresa=data['adresa'],
        latitude=float(data.get('latitude', 0)) if data.get('latitude') else None,
        longitude=float(data.get('longitude', 0)) if data.get('longitude') else None,
        photo_filename=photo_filename,
        ai_analysis=ai_analysis,
        ma_vse_potrebne=data.get('ma_vse_potrebne', 'false').lower() == 'true',
        estimated_price=estimated_price,
        customer_id=session['user_id']
    )
    
    db.session.add(order)
    db.session.commit()
    
    return jsonify({
        'message': 'Zakázka vytvořena',
        'order': order.to_dict()
    }), 201

@order_bp.route('/orders', methods=['GET'])
def get_orders():
    if 'user_id' not in session:
        return jsonify({'error': 'Nepřihlášen'}), 401
    
    user = User.query.get(session['user_id'])
    
    if user.role == 'zakaznik':
        # Zákazník vidí pouze své zakázky
        orders = Order.query.filter_by(customer_id=session['user_id']).order_by(Order.created_at.desc()).all()
    elif user.role == 'brigadnik':
        if not user.is_approved:
            return jsonify({'error': 'Váš účet brigádníka ještě nebyl schválen'}), 403
        # Brigádník vidí všechny otevřené zakázky a své přijaté
        orders = Order.query.filter(
            (Order.status == 'open') | (Order.worker_id == session['user_id'])
        ).order_by(Order.created_at.desc()).all()
    elif user.role == 'admin':
        # Admin vidí všechny zakázky
        orders = Order.query.order_by(Order.created_at.desc()).all()
    else:
        return jsonify({'error': 'Neplatná role'}), 403
    
    return jsonify([order.to_dict() for order in orders])

@order_bp.route('/orders/<int:order_id>/take', methods=['POST'])
def take_order(order_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Nepřihlášen'}), 401
    
    user = User.query.get(session['user_id'])
    if user.role != 'brigadnik':
        return jsonify({'error': 'Pouze brigádníci mohou přijímat zakázky'}), 403
    
    if not user.is_approved:
        return jsonify({'error': 'Váš účet brigádníka ještě nebyl schválen'}), 403
    
    order = Order.query.get_or_404(order_id)
    
    if order.status != 'open':
        return jsonify({'error': 'Zakázka již není dostupná'}), 400
    
    order.worker_id = session['user_id']
    order.status = 'taken'
    order.taken_at = datetime.utcnow()
    order.payment_status = 'partial'  # Zákazník platí 1/3
    db.session.commit()
    
    return jsonify({
        'message': 'Zakázka přijata. Zákazník bude požádán o zaplacení 1/3 částky.',
        'order': order.to_dict(),
        'partial_payment': order.estimated_price / 3 if order.estimated_price else 0
    }), 200

@order_bp.route('/orders/<int:order_id>/update-price', methods=['PUT'])
def update_price(order_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Nepřihlášen'}), 401
    
    order = Order.query.get_or_404(order_id)
    
    # Pouze brigádník, který si zakázku vzal, může upravit cenu
    if order.worker_id != session['user_id']:
        return jsonify({'error': 'Nemáte oprávnění upravit cenu této zakázky'}), 403
    
    if order.status not in ['taken', 'completed']:
        return jsonify({'error': 'Cenu lze upravit pouze u přijatých nebo dokončených zakázek'}), 400
    
    data = request.json
    if 'price' not in data:
        return jsonify({'error': 'Chybí nová cena'}), 400
    
    order.final_price = float(data['price'])
    db.session.commit()
    
    return jsonify({
        'message': 'Cena zakázky aktualizována',
        'order': order.to_dict()
    }), 200

@order_bp.route('/orders/<int:order_id>/complete', methods=['POST'])
def complete_order(order_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Nepřihlášen'}), 401
    
    order = Order.query.get_or_404(order_id)
    
    # Pouze brigádník, který si zakázku vzal, ji může dokončit
    if order.worker_id != session['user_id']:
        return jsonify({'error': 'Nemáte oprávnění dokončit tuto zakázku'}), 403
    
    if order.status != 'taken':
        return jsonify({'error': 'Zakázka není ve stavu "přijato"'}), 400
    
    data = request.json
    final_price = data.get('final_price', order.estimated_price)
    
    order.status = 'completed'
    order.final_price = float(final_price) if final_price else order.estimated_price
    order.completed_at = datetime.utcnow()
    order.payment_status = 'pending_final'  # Čeká na doplacení zbytku
    db.session.commit()
    
    remaining_payment = order.final_price - (order.estimated_price / 3 if order.estimated_price else 0)
    
    return jsonify({
        'message': 'Zakázka dokončena. Zákazník bude požádán o doplacení zbytku.',
        'order': order.to_dict(),
        'remaining_payment': max(0, remaining_payment)
    }), 200

@order_bp.route('/orders/<int:order_id>/cancel', methods=['POST'])
def cancel_order(order_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Nepřihlášen'}), 401
    
    order = Order.query.get_or_404(order_id)
    user = User.query.get(session['user_id'])
    
    # Brigádník může zrušit svou přijatou zakázku
    if user.role == 'brigadnik' and order.worker_id == session['user_id']:
        if order.status != 'taken':
            return jsonify({'error': 'Lze zrušit pouze přijatou zakázku'}), 400
        
        order.worker_id = None
        order.status = 'open'
        order.taken_at = None
        order.payment_status = 'pending'
        db.session.commit()
        
        return jsonify({
            'message': 'Zakázka zrušena a vrácena do seznamu dostupných',
            'order': order.to_dict()
        }), 200
    
    # Zákazník může zrušit svou otevřenou zakázku
    elif user.role == 'zakaznik' and order.customer_id == session['user_id']:
        if order.status != 'open':
            return jsonify({'error': 'Lze zrušit pouze otevřenou zakázku'}), 400
        
        # Smazání fotky pokud existuje
        if order.photo_filename:
            photo_path = os.path.join(UPLOAD_FOLDER, order.photo_filename)
            if os.path.exists(photo_path):
                os.remove(photo_path)
        
        db.session.delete(order)
        db.session.commit()
        
        return jsonify({'message': 'Zakázka zrušena'}), 200
    
    else:
        return jsonify({'error': 'Nemáte oprávnění zrušit tuto zakázku'}), 403

@order_bp.route('/orders/<int:order_id>/pay', methods=['POST'])
def pay_order(order_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Nepřihlášen'}), 401
    
    order = Order.query.get_or_404(order_id)
    
    # Pouze zákazník, který zakázku vytvořil, může platit
    if order.customer_id != session['user_id']:
        return jsonify({'error': 'Nemáte oprávnění platit tuto zakázku'}), 403
    
    data = request.json
    payment_type = data.get('payment_type', 'full')  # 'partial' nebo 'full'
    
    if payment_type == 'partial' and order.status == 'taken':
        # Částečná platba (1/3) při přijetí zakázky
        order.payment_status = 'partial'
    elif payment_type == 'full' and order.status == 'completed':
        # Doplacení zbytku po dokončení
        order.payment_status = 'completed'
        order.status = 'paid'
    else:
        return jsonify({'error': 'Neplatný typ platby nebo stav zakázky'}), 400
    
    db.session.commit()
    
    return jsonify({
        'message': 'Platba proběhla úspěšně',
        'order': order.to_dict()
    }), 200

@order_bp.route('/orders/<int:order_id>/rate', methods=['POST'])
def rate_order(order_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Nepřihlášen'}), 401
    
    order = Order.query.get_or_404(order_id)
    user = User.query.get(session['user_id'])
    
    if order.status != 'paid':
        return jsonify({'error': 'Lze hodnotit pouze zaplacené zakázky'}), 400
    
    data = request.json
    
    # Najít nebo vytvořit hodnocení
    rating = Rating.query.filter_by(order_id=order_id).first()
    if not rating:
        rating = Rating(
            order_id=order_id,
            customer_id=order.customer_id,
            worker_id=order.worker_id
        )
        db.session.add(rating)
    
    if user.role == 'zakaznik' and order.customer_id == session['user_id']:
        # Zákazník hodnotí brigádníka
        rating.worker_rating = data.get('rating')
        rating.worker_comment = data.get('comment', '')
    elif user.role == 'brigadnik' and order.worker_id == session['user_id']:
        # Brigádník hodnotí zákazníka
        rating.customer_rating = data.get('rating')
        rating.customer_comment = data.get('comment', '')
    else:
        return jsonify({'error': 'Nemáte oprávnění hodnotit tuto zakázku'}), 403
    
    db.session.commit()
    
    return jsonify({
        'message': 'Hodnocení uloženo',
        'rating': rating.to_dict()
    }), 200

@order_bp.route('/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Nepřihlášen'}), 401
    
    order = Order.query.get_or_404(order_id)
    user = User.query.get(session['user_id'])
    
    # Kontrola oprávnění
    if user.role == 'admin':
        # Admin vidí všechny zakázky
        pass
    elif order.customer_id != session['user_id'] and order.worker_id != session['user_id']:
        return jsonify({'error': 'Nemáte oprávnění zobrazit tuto zakázku'}), 403
    
    return jsonify(order.to_dict())

@order_bp.route('/orders/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Nepřihlášen'}), 401
    
    order = Order.query.get_or_404(order_id)
    user = User.query.get(session['user_id'])
    
    # Pouze admin nebo zákazník může smazat zakázku
    if user.role == 'admin':
        # Admin může smazat jakoukoli zakázku
        pass
    elif user.role == 'zakaznik' and order.customer_id == session['user_id']:
        # Zákazník může smazat svou zakázku pouze pokud není přijata
        if order.status != 'open':
            return jsonify({'error': 'Nelze smazat zakázku, která již byla přijata'}), 400
    else:
        return jsonify({'error': 'Nemáte oprávnění smazat tuto zakázku'}), 403
    
    # Smazání fotky pokud existuje
    if order.photo_filename:
        photo_path = os.path.join(UPLOAD_FOLDER, order.photo_filename)
        if os.path.exists(photo_path):
            os.remove(photo_path)
    
    db.session.delete(order)
    db.session.commit()
    
    return jsonify({'message': 'Zakázka smazána'}), 200

@order_bp.route('/statistics', methods=['GET'])
def get_statistics():
    if 'user_id' not in session:
        return jsonify({'error': 'Nepřihlášen'}), 401
    
    user = User.query.get(session['user_id'])
    
    if user.role != 'admin':
        return jsonify({'error': 'Pouze admin má přístup ke statistikám'}), 403
    
    # Základní statistiky
    total_orders = Order.query.count()
    completed_orders = Order.query.filter_by(status='paid').count()
    total_revenue = db.session.query(db.func.sum(Order.final_price)).filter_by(status='paid').scalar() or 0
    total_customers = User.query.filter_by(role='zakaznik').count()
    total_workers = User.query.filter_by(role='brigadnik').count()
    approved_workers = User.query.filter_by(role='brigadnik', is_approved=True).count()
    
    return jsonify({
        'total_orders': total_orders,
        'completed_orders': completed_orders,
        'total_revenue': total_revenue,
        'total_customers': total_customers,
        'total_workers': total_workers,
        'approved_workers': approved_workers,
        'completion_rate': (completed_orders / total_orders * 100) if total_orders > 0 else 0
    }), 200

@order_bp.route('/ratings/<int:user_id>', methods=['GET'])
def get_user_ratings(user_id):
    """Získání hodnocení konkrétního uživatele"""
    if 'user_id' not in session:
        return jsonify({'error': 'Nepřihlášen'}), 401
    
    user = User.query.get_or_404(user_id)
    
    if user.role == 'brigadnik':
        # Hodnocení brigádníka od zákazníků
        ratings = Rating.query.filter_by(worker_id=user_id).filter(Rating.worker_rating.isnot(None)).all()
        avg_rating = db.session.query(db.func.avg(Rating.worker_rating)).filter_by(worker_id=user_id).scalar()
    elif user.role == 'zakaznik':
        # Hodnocení zákazníka od brigádníků
        ratings = Rating.query.filter_by(customer_id=user_id).filter(Rating.customer_rating.isnot(None)).all()
        avg_rating = db.session.query(db.func.avg(Rating.customer_rating)).filter_by(customer_id=user_id).scalar()
    else:
        return jsonify({'error': 'Neplatná role pro hodnocení'}), 400
    
    return jsonify({
        'user_id': user_id,
        'average_rating': round(avg_rating, 2) if avg_rating else None,
        'total_ratings': len(ratings),
        'ratings': [rating.to_dict() for rating in ratings]
    }), 200

