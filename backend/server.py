from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Initialize admin user on startup
@app.on_event("startup")
async def create_default_admin():
    admin_email = "admin@mardecortez.com"
    existing_admin = await db.users.find_one({"email": admin_email}, {"_id": 0})
    
    if not existing_admin:
        admin_id = str(uuid.uuid4())
        admin_user = {
            "id": admin_id,
            "email": admin_email,
            "password_hash": hash_password("admin123"),
            "name": "Administrador",
            "role": "admin",
            "company": "Mar de Cortez",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        logger.info(f"Admin user created: {admin_email} / admin123")

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str  # 'cliente' or 'proveedor'
    company: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: str
    company: Optional[str] = None

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    category: str  # 'alimentos', 'electronica', 'ferreteria', 'bebidas', 'otros'
    price: float  # Precio final con ganancia e IVA
    base_price: Optional[float] = None  # Precio base/costo
    profit_type: Optional[str] = None  # 'percentage' o 'fixed'
    profit_value: Optional[float] = None  # Porcentaje o monto fijo
    iva_percentage: Optional[float] = 16.0  # IVA (default 16%)
    supplier_id: str
    supplier_name: str
    sku: str
    image_url: Optional[str] = None
    created_at: str

class ProductCreate(BaseModel):
    name: str
    description: str
    category: str
    base_price: float  # Precio base
    profit_type: str  # 'percentage' o 'fixed'
    profit_value: float  # Valor de ganancia
    iva_percentage: float = 16.0  # IVA
    sku: str
    image_url: Optional[str] = None

class OrderProduct(BaseModel):
    product_id: Optional[str] = None  # None for custom products
    product_name: str
    quantity: int
    price: Optional[float] = None  # Optional for custom products
    description: Optional[str] = None  # For custom products
    image_url: Optional[str] = None  # For custom products
    is_custom: bool = False

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    order_number: str
    client_id: str
    client_name: str
    supplier_id: Optional[str] = None
    supplier_name: Optional[str] = None
    products: List[OrderProduct]
    total: float
    status: str  # 'pendiente', 'recibido', 'en_proceso', 'completado', 'cancelado'
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    updated_at: str
    requested_by: Optional[str] = None  # Usuario que creó la orden

class OrderCreate(BaseModel):
    products: List[OrderProduct]
    notes: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str
    assigned_to: Optional[str] = None

class Quotation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    order_id: str
    supplier_id: str
    supplier_name: str
    file_data: str  # base64 encoded PDF
    file_name: str
    amount: Optional[float] = None
    notes: Optional[str] = None
    created_at: str

class QuotationCreate(BaseModel):
    amount: Optional[float] = None
    notes: Optional[str] = None

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    message: str
    read: bool
    created_at: str

class RegistrationRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    boat_name: str
    captain_name: str
    phone: str
    email: EmailStr
    status: str  # 'pendiente', 'aprobado', 'rechazado'
    created_at: str
    processed_by: Optional[str] = None
    processed_at: Optional[str] = None

class RegistrationRequestCreate(BaseModel):
    boat_name: str
    captain_name: str
    phone: str
    email: EmailStr

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    created_at: str

class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str
    company: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    name: Optional[str] = None
    company: Optional[str] = None

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def create_notification(user_id: str, message: str):
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "message": message,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)

# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "role": user_data.role,
        "company": user_data.company,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_access_token({"sub": user_id, "role": user_data.role})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "role": user_data.role,
            "company": user_data.company
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc or not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": user_doc["id"], "role": user_doc["role"]})
    
    return {
        "token": token,
        "user": {
            "id": user_doc["id"],
            "email": user_doc["email"],
            "name": user_doc["name"],
            "role": user_doc["role"],
            "company": user_doc.get("company")
        }
    }

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Product Routes
@api_router.get("/products", response_model=List[Product])
async def get_products(
    category: Optional[str] = None,
    supplier_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if category:
        query["category"] = category
    if supplier_id:
        query["supplier_id"] = supplier_id
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    return products

@api_router.post("/products", response_model=Product)
async def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "proveedor":
        raise HTTPException(status_code=403, detail="Only suppliers can create products")
    
    # Calculate final price
    final_price = product_data.base_price
    
    # Add profit
    if product_data.profit_type == "percentage":
        final_price += final_price * (product_data.profit_value / 100)
    else:  # fixed
        final_price += product_data.profit_value
    
    # Add IVA
    final_price += final_price * (product_data.iva_percentage / 100)
    
    product_id = str(uuid.uuid4())
    product_doc = {
        "id": product_id,
        "name": product_data.name,
        "description": product_data.description,
        "category": product_data.category,
        "base_price": product_data.base_price,
        "profit_type": product_data.profit_type,
        "profit_value": product_data.profit_value,
        "iva_percentage": product_data.iva_percentage,
        "price": round(final_price, 2),
        "supplier_id": current_user.id,
        "supplier_name": current_user.name,
        "sku": product_data.sku,
        "image_url": product_data.image_url,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.products.insert_one(product_doc)
    return Product(**product_doc)

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product_data: ProductCreate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "proveedor":
        raise HTTPException(status_code=403, detail="Only suppliers can update products")
    
    existing = await db.products.find_one({"id": product_id, "supplier_id": current_user.id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Calculate final price
    final_price = product_data.base_price
    
    # Add profit
    if product_data.profit_type == "percentage":
        final_price += final_price * (product_data.profit_value / 100)
    else:  # fixed
        final_price += product_data.profit_value
    
    # Add IVA
    final_price += final_price * (product_data.iva_percentage / 100)
    
    update_data = {
        "name": product_data.name,
        "description": product_data.description,
        "category": product_data.category,
        "base_price": product_data.base_price,
        "profit_type": product_data.profit_type,
        "profit_value": product_data.profit_value,
        "iva_percentage": product_data.iva_percentage,
        "price": round(final_price, 2),
        "sku": product_data.sku,
        "image_url": product_data.image_url,
        "supplier_name": current_user.name
    }
    
    await db.products.update_one(
        {"id": product_id},
        {"$set": update_data}
    )
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return Product(**updated)

@api_router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "proveedor":
        raise HTTPException(status_code=403, detail="Only suppliers can delete products")
    
    result = await db.products.delete_one({"id": product_id, "supplier_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted successfully"}

# Order Routes
@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: User = Depends(get_current_user)):
    query = {}
    if current_user.role == "cliente":
        query["client_id"] = current_user.id
    elif current_user.role == "proveedor":
        query["supplier_id"] = current_user.id
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check access permissions
    if current_user.role == "cliente" and order["client_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == "proveedor" and order["supplier_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return Order(**order)

@api_router.post("/orders", response_model=Order)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "cliente":
        raise HTTPException(status_code=403, detail="Only clients can create orders")
    
    # Process products and calculate total
    processed_products = []
    total = 0
    suppliers = set()
    
    for product in order_data.products:
        if product.is_custom:
            # Custom product requested by client
            processed_product = {
                "product_id": None,
                "product_name": product.product_name,
                "quantity": product.quantity,
                "price": None,
                "description": product.description,
                "image_url": product.image_url,
                "is_custom": True
            }
        else:
            # Existing product from database
            db_product = await db.products.find_one({"id": product.product_id}, {"_id": 0})
            if not db_product:
                raise HTTPException(status_code=404, detail=f"Product {product.product_id} not found")
            
            processed_product = {
                "product_id": product.product_id,
                "product_name": db_product["name"],
                "quantity": product.quantity,
                "price": db_product["price"],
                "is_custom": False
            }
            
            # Track supplier
            suppliers.add(db_product["supplier_id"])
            
            # Add to total (only for existing products with price)
            total += db_product["price"] * product.quantity
        
        processed_products.append(processed_product)
    
    # If multiple suppliers or custom products, don't assign a specific supplier
    supplier_id = None
    supplier_name = None
    
    if len(suppliers) == 1 and not any(p.get("is_custom") for p in processed_products):
        # Single supplier and no custom products
        supplier_id = list(suppliers)[0]
        supplier_doc = await db.users.find_one({"id": supplier_id}, {"_id": 0})
        if supplier_doc:
            supplier_name = supplier_doc["name"]
    
    order_id = str(uuid.uuid4())
    order_number = f"ORD-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{order_id[:8].upper()}"
    
    order_doc = {
        "id": order_id,
        "order_number": order_number,
        "client_id": current_user.id,
        "client_name": current_user.name,
        "supplier_id": supplier_id,
        "supplier_name": supplier_name,
        "products": processed_products,
        "total": total,
        "status": "pendiente",
        "assigned_to": None,
        "notes": order_data.notes,
        "requested_by": current_user.name,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    
    # Create notifications for suppliers if any
    if supplier_id:
        await create_notification(
            supplier_id,
            f"Nueva orden recibida: {order_number} de {current_user.name}"
        )
    
    return Order(**order_doc)

@api_router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    status_data: OrderStatusUpdate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "proveedor":
        raise HTTPException(status_code=403, detail="Only suppliers can update order status")
    
    order = await db.orders.find_one({"id": order_id, "supplier_id": current_user.id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = {
        "status": status_data.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if status_data.assigned_to:
        update_data["assigned_to"] = status_data.assigned_to
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": update_data}
    )
    
    # Create notification for client
    await create_notification(
        order["client_id"],
        f"Estado de orden {order['order_number']} actualizado a: {status_data.status}"
    )
    
    updated = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return Order(**updated)

# Quotation Routes
@api_router.post("/orders/{order_id}/quotation", response_model=Quotation)
async def upload_quotation(
    order_id: str,
    file: UploadFile = File(...),
    amount: Optional[float] = None,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "proveedor":
        raise HTTPException(status_code=403, detail="Only suppliers can upload quotations")
    
    order = await db.orders.find_one({"id": order_id, "supplier_id": current_user.id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Read file and encode to base64
    file_content = await file.read()
    file_data = base64.b64encode(file_content).decode('utf-8')
    
    quotation_id = str(uuid.uuid4())
    quotation_doc = {
        "id": quotation_id,
        "order_id": order_id,
        "supplier_id": current_user.id,
        "supplier_name": current_user.name,
        "file_data": file_data,
        "file_name": file.filename,
        "amount": amount,
        "notes": notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.quotations.insert_one(quotation_doc)
    
    # Create notification for client
    await create_notification(
        order["client_id"],
        f"Nueva cotización recibida para orden {order['order_number']}"
    )
    
    return Quotation(**quotation_doc)

@api_router.get("/orders/{order_id}/quotations", response_model=List[Quotation])
async def get_quotations(
    order_id: str,
    current_user: User = Depends(get_current_user)
):
    # Verify access to order
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if current_user.role == "cliente" and order["client_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == "proveedor" and order["supplier_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    quotations = await db.quotations.find({"order_id": order_id}, {"_id": 0}).to_list(1000)
    return quotations

# Notification Routes
@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user: User = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user.id},
        {"$set": {"read": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}

# Category Routes (Public for listing)
@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    return categories

@api_router.post("/categories", response_model=Category)
async def create_category_by_supplier(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["proveedor", "admin"]:
        raise HTTPException(status_code=403, detail="Solo proveedores y admins pueden crear categorías")
    
    existing = await db.categories.find_one({"slug": category_data.slug}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Esta categoría ya existe")
    
    category_id = str(uuid.uuid4())
    category_doc = {
        "id": category_id,
        "name": category_data.name,
        "slug": category_data.slug,
        "description": category_data.description,
        "created_by": current_user.id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.categories.insert_one(category_doc)
    return Category(**category_doc)

@api_router.delete("/categories/{category_id}")
async def delete_category_by_supplier(
    category_id: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["proveedor", "admin"]:
        raise HTTPException(status_code=403, detail="Solo proveedores y admins pueden eliminar categorías")
    
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    return {"message": "Categoría eliminada exitosamente"}


# Registration Request Routes (Public)
@api_router.post("/registration-requests")
async def create_registration_request(request_data: RegistrationRequestCreate):
    # Check if email already exists
    existing_user = await db.users.find_one({"email": request_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Este correo ya está registrado en el sistema")
    
    existing_request = await db.registration_requests.find_one(
        {"email": request_data.email, "status": "pendiente"}, 
        {"_id": 0}
    )
    if existing_request:
        raise HTTPException(status_code=400, detail="Ya existe una solicitud pendiente con este correo")
    
    request_id = str(uuid.uuid4())
    request_doc = {
        "id": request_id,
        "boat_name": request_data.boat_name,
        "captain_name": request_data.captain_name,
        "phone": request_data.phone,
        "email": request_data.email,
        "status": "pendiente",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "processed_by": None,
        "processed_at": None
    }
    
    await db.registration_requests.insert_one(request_doc)
    
    return {"message": "Solicitud enviada exitosamente. El equipo de Mar de Cortez se pondrá en contacto contigo.", "id": request_id}

# Admin Routes
@api_router.get("/admin/registration-requests", response_model=List[RegistrationRequest])
async def get_registration_requests(
    status: Optional[str] = None,
    admin_user: User = Depends(get_admin_user)
):
    query = {}
    if status:
        query["status"] = status
    
    requests = await db.registration_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return requests

@api_router.put("/admin/registration-requests/{request_id}/approve")
async def approve_registration_request(
    request_id: str,
    user_data: UserCreate,
    admin_user: User = Depends(get_admin_user)
):
    request_doc = await db.registration_requests.find_one({"id": request_id}, {"_id": 0})
    if not request_doc:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    if request_doc["status"] != "pendiente":
        raise HTTPException(status_code=400, detail="Esta solicitud ya fue procesada")
    
    # Create user
    user_id = str(uuid.uuid4())
    new_user = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "role": user_data.role,
        "company": user_data.company,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(new_user)
    
    # Update request status
    await db.registration_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": "aprobado",
            "processed_by": admin_user.id,
            "processed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Solicitud aprobada y usuario creado", "user_id": user_id}

@api_router.put("/admin/registration-requests/{request_id}/reject")
async def reject_registration_request(
    request_id: str,
    admin_user: User = Depends(get_admin_user)
):
    request_doc = await db.registration_requests.find_one({"id": request_id}, {"_id": 0})
    if not request_doc:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    if request_doc["status"] != "pendiente":
        raise HTTPException(status_code=400, detail="Esta solicitud ya fue procesada")
    
    await db.registration_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": "rechazado",
            "processed_by": admin_user.id,
            "processed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Solicitud rechazada"}

@api_router.post("/admin/users", response_model=User)
async def create_user_by_admin(
    user_data: UserCreate,
    admin_user: User = Depends(get_admin_user)
):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "role": user_data.role,
        "company": user_data.company,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    return User(**user_doc)

@api_router.get("/admin/users", response_model=List[User])
async def get_all_users(
    role: Optional[str] = None,
    admin_user: User = Depends(get_admin_user)
):
    query = {}
    if role:
        query["role"] = role
    
    users = await db.users.find(query, {"_id": 0}).to_list(1000)
    return users

@api_router.put("/admin/users/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    admin_user: User = Depends(get_admin_user)
):
    existing = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    update_data = {}
    if user_data.name:
        update_data["name"] = user_data.name
    if user_data.email:
        # Check if email is already used by another user
        email_check = await db.users.find_one({"email": user_data.email, "id": {"$ne": user_id}}, {"_id": 0})
        if email_check:
            raise HTTPException(status_code=400, detail="Este email ya está en uso")
        update_data["email"] = user_data.email
    if user_data.company is not None:
        update_data["company"] = user_data.company
    if user_data.password:
        update_data["password_hash"] = hash_password(user_data.password)
    
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated = await db.users.find_one({"id": user_id}, {"_id": 0})
    return User(**updated)

@api_router.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    admin_user: User = Depends(get_admin_user)
):
    # Prevent deleting admin users
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if user["role"] == "admin":
        raise HTTPException(status_code=400, detail="No se pueden eliminar usuarios administradores")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return {"message": "Usuario eliminado exitosamente"}

@api_router.get("/admin/orders", response_model=List[Order])
async def get_all_orders(admin_user: User = Depends(get_admin_user)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.get("/admin/products", response_model=List[Product])
async def get_all_products(admin_user: User = Depends(get_admin_user)):
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    return products

@api_router.post("/admin/products", response_model=Product)
async def create_product_by_admin(
    product_data: ProductCreate,
    supplier_id: str,
    admin_user: User = Depends(get_admin_user)
):
    # Get supplier info
    supplier = await db.users.find_one({"id": supplier_id, "role": "proveedor"}, {"_id": 0})
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    product_id = str(uuid.uuid4())
    product_doc = {
        "id": product_id,
        "name": product_data.name,
        "description": product_data.description,
        "category": product_data.category,
        "price": product_data.price,
        "supplier_id": supplier_id,
        "supplier_name": supplier["name"],
        "sku": product_data.sku,
        "image_url": product_data.image_url,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.products.insert_one(product_doc)
    return Product(**product_doc)

@api_router.put("/admin/products/{product_id}", response_model=Product)
async def update_product_by_admin(
    product_id: str,
    product_data: ProductCreate,
    admin_user: User = Depends(get_admin_user)
):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    update_data = product_data.model_dump()
    
    await db.products.update_one(
        {"id": product_id},
        {"$set": update_data}
    )
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return Product(**updated)

@api_router.delete("/admin/products/{product_id}")
async def delete_product_by_admin(
    product_id: str,
    admin_user: User = Depends(get_admin_user)
):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return {"message": "Producto eliminado exitosamente"}

@api_router.post("/admin/categories", response_model=Category)
async def create_category(
    category_data: CategoryCreate,
    admin_user: User = Depends(get_admin_user)
):
    existing = await db.categories.find_one({"slug": category_data.slug}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Category slug already exists")
    
    category_id = str(uuid.uuid4())
    category_doc = {
        "id": category_id,
        "name": category_data.name,
        "slug": category_data.slug,
        "description": category_data.description,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.categories.insert_one(category_doc)
    return Category(**category_doc)

@api_router.get("/admin/categories", response_model=List[Category])
async def get_all_categories(admin_user: User = Depends(get_admin_user)):
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    return categories

@api_router.delete("/admin/categories/{category_id}")
async def delete_category(
    category_id: str,
    admin_user: User = Depends(get_admin_user)
):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"message": "Category deleted successfully"}

@api_router.get("/admin/stats")
async def get_admin_stats(admin_user: User = Depends(get_admin_user)):
    total_users = await db.users.count_documents({})
    total_clients = await db.users.count_documents({"role": "cliente"})
    total_suppliers = await db.users.count_documents({"role": "proveedor"})
    total_orders = await db.orders.count_documents({})
    total_products = await db.products.count_documents({})
    pending_requests = await db.registration_requests.count_documents({"status": "pendiente"})
    
    # Calculate revenue
    orders = await db.orders.find({"status": "completado"}, {"_id": 0}).to_list(10000)
    total_revenue = sum(order.get("total", 0) for order in orders)
    
    return {
        "total_users": total_users,
        "total_clients": total_clients,
        "total_suppliers": total_suppliers,
        "total_orders": total_orders,
        "total_products": total_products,
        "pending_requests": pending_requests,
        "total_revenue": total_revenue
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()