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
    price: float
    supplier_id: str
    supplier_name: str
    sku: str
    created_at: str

class ProductCreate(BaseModel):
    name: str
    description: str
    category: str
    price: float
    sku: str

class OrderProduct(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    order_number: str
    client_id: str
    client_name: str
    supplier_id: str
    supplier_name: str
    products: List[OrderProduct]
    total: float
    status: str  # 'pendiente', 'recibido', 'en_proceso', 'completado', 'cancelado'
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    updated_at: str

class OrderCreate(BaseModel):
    supplier_id: str
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
    
    product_id = str(uuid.uuid4())
    product_doc = {
        "id": product_id,
        "name": product_data.name,
        "description": product_data.description,
        "category": product_data.category,
        "price": product_data.price,
        "supplier_id": current_user.id,
        "supplier_name": current_user.name,
        "sku": product_data.sku,
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
    
    update_data = product_data.model_dump()
    update_data["supplier_name"] = current_user.name
    
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
    
    # Get supplier info
    supplier = await db.users.find_one({"id": order_data.supplier_id, "role": "proveedor"}, {"_id": 0})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Calculate total
    total = sum(p.price * p.quantity for p in order_data.products)
    
    order_id = str(uuid.uuid4())
    order_number = f"ORD-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{order_id[:8].upper()}"
    
    order_doc = {
        "id": order_id,
        "order_number": order_number,
        "client_id": current_user.id,
        "client_name": current_user.name,
        "supplier_id": order_data.supplier_id,
        "supplier_name": supplier["name"],
        "products": [p.model_dump() for p in order_data.products],
        "total": total,
        "status": "pendiente",
        "assigned_to": None,
        "notes": order_data.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    
    # Create notification for supplier
    await create_notification(
        order_data.supplier_id,
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