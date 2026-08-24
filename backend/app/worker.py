import os
from celery import Celery
from app.config import settings

# Initialize Celery app instance
celery_app = Celery(
    "urbancoolsim_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=settings.JOB_TIMEOUT_SECONDS,
)

@celery_app.task(name="app.worker.run_async_simulation")
def run_async_simulation(scenario_id: str, weather_params: dict):
    """
    Background worker task for physics surface energy balance simulations.
    """
    from app.physics.energy_balance import EnergyBalanceSolver
    from app.api.digital_twin_router import generate_synthetic_connaught_place_grid
    import numpy as np

    grid = generate_synthetic_connaught_place_grid(rows=40, cols=40)
    layers = grid["layers"]
    solver = EnergyBalanceSolver(
        solar_rad=weather_params.get("solar_rad", 850.0),
        air_temp_c=weather_params.get("air_temp_c", 38.5),
        rel_humidity=weather_params.get("rel_humidity", 0.45),
        wind_speed=weather_params.get("wind_speed", 2.5)
    )

    grid_inputs = {
        "albedo": np.array(layers["albedo"]),
        "emissivity": 0.95,
        "veg_fraction": np.array(layers["veg_fraction"]),
        "water_fraction": np.array(layers["water_fraction"]),
        "building_height": np.array(layers["building_height"]),
        "building_density": np.array(layers["building_density"]),
        "q_f": weather_params.get("q_f", 35.0)
    }

    res = solver.solve_grid(grid_inputs, interventions={})
    return {
        "status": "COMPLETED",
        "scenario_id": scenario_id,
        "mean_surface_temp_c": float(np.mean(res["T_surface_c"]))
    }

@celery_app.task(name="app.worker.run_async_optimization")
def run_async_optimization(max_budget: float, max_water: float, pop_size: int = 30, n_gen: int = 20):
    """
    Background worker task for NSGA-II multi-objective optimization.
    """
    from app.optimization.pareto_optimizer import run_multi_objective_optimization
    res = run_multi_objective_optimization(
        max_budget_usd=max_budget,
        max_water_m3=max_water,
        pop_size=pop_size,
        n_gen=n_gen
    )
    return {
        "status": "COMPLETED",
        "pareto_solutions_count": len(res.get("pareto_solutions", [])),
        "recommended_solution": res.get("recommended_solution")
    }
