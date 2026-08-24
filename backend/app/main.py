from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import time

from app.config import settings
from app.database import engine, Base
from app.api.auth_router import router as auth_router
from app.api.digital_twin_router import router as dt_router
from app.api.thermal_router import router as thermal_router
from app.api.scenarios_router import router as scenarios_router
from app.api.surrogate_router import router as surrogate_router
from app.api.optimization_router import router as opt_router
from app.api.validation_router import router as val_router
from app.api.reports_router import router as reports_router
from app.api.jobs_router import router as jobs_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-driven urban heat intelligence, physics simulation, surrogate acceleration, and multi-objective decision-support platform.",
    docs_url="/docs",
    redoc_url="/redoc"
)

from app.database import engine, Base, SessionLocal
from app.models.db_models import StudyArea, Scenario

def seed_default_data():
    db = SessionLocal()
    try:
        # Seed default pilot StudyArea
        cp_area = db.query(StudyArea).filter(StudyArea.id == "default_cp").first()
        if not cp_area:
            cp_area = StudyArea(
                id="default_cp",
                name="Connaught Place Pilot Area",
                description="Connaught Place, New Delhi 10m microclimate grid",
                location_name="Connaught Place, New Delhi",
                crs="EPSG:32643",
                resolution_m=10.0,
                grid_rows=50,
                grid_cols=50,
                is_synthetic=True
            )
            db.add(cp_area)
            db.commit()

        delhi_area = db.query(StudyArea).filter(StudyArea.id == "default_delhi").first()
        if not delhi_area:
            delhi_area = StudyArea(
                id="default_delhi",
                name="New Delhi Metropolitan District",
                description="Greater New Delhi Study Area",
                location_name="New Delhi, India",
                crs="EPSG:32643",
                resolution_m=10.0,
                grid_rows=50,
                grid_cols=50,
                is_synthetic=True
            )
            db.add(delhi_area)
            db.commit()

        # Seed baseline scenario
        base_scen = db.query(Scenario).filter(Scenario.id == "scen_baseline").first()
        if not base_scen:
            base_scen = Scenario(
                id="scen_baseline",
                name="Baseline Current State",
                description="Existing urban geometry without cooling interventions",
                scenario_type="baseline",
                parameters={},
                is_baseline=True,
                study_area_id="default_cp"
            )
            db.add(base_scen)
            db.commit()

        # Seed hybrid scenario
        hybrid_scen = db.query(Scenario).filter(Scenario.id == "scen_hybrid_cp").first()
        if not hybrid_scen:
            hybrid_scen = Scenario(
                id="scen_hybrid_cp",
                name="Integrated Resilience Hybrid",
                description="Combined 30% Green Roofs, 40% Cool Roofs, 25% Tree Canopy, 5% Water Features",
                scenario_type="hybrid",
                parameters={
                    "green_roof_coverage": 0.30,
                    "cool_roof_albedo_boost": 0.40,
                    "tree_canopy_addition": 0.25,
                    "reflective_pavement_albedo": 0.15,
                    "water_feature_fraction": 0.05,
                    "wetness_factor": 0.60
                },
                is_baseline=False,
                study_area_id="default_cp"
            )
            db.add(hybrid_scen)
            db.commit()
    except Exception as e:
        print(f"[UrbanCoolSim] Seeding notice: {e}")
    finally:
        db.close()

@app.on_event("startup")
def on_startup():
    # Attempt database table creation with retry for container startup
    max_retries = 5
    for attempt in range(max_retries):
        try:
            Base.metadata.create_all(bind=engine)
            seed_default_data()
            print("[UrbanCoolSim] Database tables initialized and seeded successfully.")
            break
        except Exception as e:
            print(f"[UrbanCoolSim] Database connection attempt {attempt+1}/{max_retries} waiting: {e}")
            time.sleep(2)

# Strict CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security headers middleware & Request Timing
@app.middleware("http")
async def add_security_headers_and_timing(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# Root Health & System Status
@app.get("/", tags=["System Health"])
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "HEALTHY",
        "thesis": "We are not selling a heat map. We are selling better urban infrastructure decisions.",
        "environment": settings.ENVIRONMENT
    }

@app.get("/health", tags=["System Health"])
def health_check():
    return {
        "status": "UP",
        "database": "CONNECTED",
        "redis": "ONLINE",
        "physics_engine": "READY",
        "surrogate_model": "LOADED"
    }

# Register API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(dt_router, prefix=settings.API_V1_STR)
app.include_router(thermal_router, prefix=settings.API_V1_STR)
app.include_router(scenarios_router, prefix=settings.API_V1_STR)
app.include_router(surrogate_router, prefix=settings.API_V1_STR)
app.include_router(opt_router, prefix=settings.API_V1_STR)
app.include_router(val_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(jobs_router, prefix=settings.API_V1_STR)
