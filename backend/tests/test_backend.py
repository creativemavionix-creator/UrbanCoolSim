import pytest
from fastapi.testclient import TestClient
import numpy as np

from app.main import app
from app.physics.energy_balance import EnergyBalanceSolver
from app.ml.surrogate import SurrogateModelPipeline
from app.optimization.pareto_optimizer import run_multi_objective_optimization

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "UP"

def test_physics_energy_balance_solver():
    solver = EnergyBalanceSolver(solar_rad=850.0, air_temp_c=38.5, rel_humidity=0.45, wind_speed=2.5)
    
    # Solve cell equilibrium for baseline built environment
    base_res = solver.solve_cell_equilibrium(
        albedo=0.15, emissivity=0.95, veg_fraction=0.10, water_fraction=0.0,
        building_height=20.0, building_density=0.50, q_f=35.0
    )
    
    # Solve cell equilibrium for cool intervention environment (+albedo, +veg)
    scen_res = solver.solve_cell_equilibrium(
        albedo=0.45, emissivity=0.95, veg_fraction=0.40, water_fraction=0.0,
        building_height=20.0, building_density=0.50, q_f=35.0
    )
    
    assert "T_surface_c" in base_res
    assert base_res["T_surface_c"] > scen_res["T_surface_c"], "Intervention must result in lower equilibrium temperature"
    
    # Energy Balance Conservation Check: Q* + Qf - (Qh + Qe + dQs) should be near zero
    residual = (base_res["Q_star"] + base_res["Q_f"]) - (base_res["Q_h"] + base_res["Q_e"] + base_res["dQs"])
    assert abs(residual) < 1.0, f"Energy balance conservation violated: residual = {residual}"

def test_surrogate_model_training_and_prediction():
    pipeline = SurrogateModelPipeline()
    metrics = pipeline.train_and_evaluate(n_samples=800)
    
    assert "surrogate_lgbm" in metrics
    assert metrics["surrogate_lgbm"]["r2"] > 0.70, "Surrogate model R² should be high on physics ground truth"
    
    # Test fast prediction
    pred = pipeline.predict_delta_t({
        "green_roof_coverage": 0.5,
        "cool_roof_albedo_boost": 0.3,
        "tree_canopy_addition": 0.2
    })
    assert pred >= 0.0

def test_nsga2_multi_objective_optimization():
    opt_res = run_multi_objective_optimization(
        max_budget_usd=300000.0,
        pop_size=20,
        n_gen=10
    )
    
    assert "pareto_solutions" in opt_res
    assert len(opt_res["pareto_solutions"]) > 0
    assert opt_res["physics_validated"] is True
    assert "validated_delta_t" in opt_res["recommended_solution"]

def test_auth_user_flow():
    import uuid
    email = f"planner_test_{uuid.uuid4().hex[:8]}@urbancoolsim.org"
    # 1. Register
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "SecurePassword123!",
        "full_name": "Climate Planner",
        "role": "planner"
    })
    assert reg_resp.status_code == 201
    
    # 2. Login
    login_resp = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "SecurePassword123!"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    
    # 3. Access Protected Route
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == email
