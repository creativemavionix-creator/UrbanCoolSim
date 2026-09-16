import os
import uuid
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.auth.security import get_current_user_optional, rate_limiter
from app.models.db_models import User, Report, StudyArea, Scenario, SimulationResult, OptimizationRun
from app.schemas.schemas import ReportCreate, ReportResponse
from app.reports.report_builder import ReportBuilder
from app.api.digital_twin_router import STUDY_AREAS_METADATA

router = APIRouter(prefix="/reports", tags=["Decision Support Reports"])

def resolve_study_area_name(study_area_id: Optional[str], db: Session) -> str:
    if not study_area_id:
        return "Urban Microclimate Pilot Area"
    sa = db.query(StudyArea).filter(StudyArea.id == study_area_id).first()
    if sa and sa.name:
        return f"{sa.name} ({sa.location_name})" if sa.location_name else sa.name
    for meta in STUDY_AREAS_METADATA:
        if meta["id"] == study_area_id:
            return f"{meta['name']}, {meta['city']}, {meta['country']}"
    return study_area_id.replace("_", " ").title()

@router.post("/generate", response_model=ReportResponse)
def generate_report(
    request: Request,
    req: ReportCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    if request.client:
        rate_limiter.check(request.client.host)
        
    report_id = str(uuid.uuid4())
    study_area_name = resolve_study_area_name(req.study_area_id, db)
    
    # Resolve scenario metrics if provided
    baseline_stats: Optional[Dict[str, float]] = None
    scenario_stats: Optional[Dict[str, float]] = None
    if req.scenario_id:
        sim_res = db.query(SimulationResult).filter(
            SimulationResult.scenario_id == req.scenario_id
        ).order_by(SimulationResult.created_at.desc()).first()
        if sim_res:
            baseline_stats = {
                "baseline_t_mean": sim_res.baseline_t_mean,
                "delta_t_mean": sim_res.delta_t_mean
            }
            scenario_stats = {
                "scenario_t_mean": sim_res.scenario_t_mean
            }
    
    # Resolve optimization metrics if provided
    opt_res: Optional[Dict[str, Any]] = None
    if req.optimization_run_id:
        opt_run = db.query(OptimizationRun).filter(
            OptimizationRun.id == req.optimization_run_id
        ).first()
        if opt_run and opt_run.recommended_solution:
            opt_res = {"recommended_solution": opt_run.recommended_solution}

    md_content = ReportBuilder.generate_markdown_report(
        study_area_name=study_area_name,
        baseline_stats=baseline_stats,
        scenario_stats=scenario_stats,
        optimization_res=opt_res
    )
    
    # Generate PDF file
    reports_dir = os.path.join(settings.STORAGE_DIR, "reports")
    os.makedirs(reports_dir, exist_ok=True)
    pdf_filepath = os.path.join(reports_dir, f"report_{report_id}.pdf")
    
    try:
        ReportBuilder.generate_pdf_report(
            output_path=pdf_filepath,
            study_area_name=study_area_name,
            baseline_stats=baseline_stats,
            scenario_stats=scenario_stats,
            optimization_res=opt_res
        )
        pdf_path_val = f"/api/v1/reports/{report_id}/pdf"
    except Exception as e:
        print(f"[UrbanCoolSim] PDF generation notice: {e}")
        pdf_path_val = None

    report_db = Report(
        id=report_id,
        title=req.title or f"UrbanCoolSim Executive Decision Report — {study_area_name}",
        summary=f"Spatial microclimate thermodynamic assessment and optimization recommendations for {study_area_name}.",
        markdown_content=md_content,
        pdf_path=pdf_path_val,
        study_area_id=req.study_area_id,
        scenario_id=req.scenario_id,
        optimization_run_id=req.optimization_run_id,
        owner_id=current_user.id if current_user else None
    )
    db.add(report_db)
    db.commit()
    db.refresh(report_db)
    
    return ReportResponse(
        id=report_db.id,
        title=report_db.title,
        summary=report_db.summary,
        markdown_content=report_db.markdown_content,
        pdf_path=report_db.pdf_path,
        created_at=report_db.created_at
    )

@router.get("/{report_id}/pdf")
def download_report_pdf(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report '{report_id}' not found"
        )
        
    reports_dir = os.path.join(settings.STORAGE_DIR, "reports")
    pdf_filepath = os.path.join(reports_dir, f"report_{report_id}.pdf")
    
    if not os.path.exists(pdf_filepath):
        # Generate on the fly using report's study area
        study_area_name = resolve_study_area_name(report.study_area_id, db)
        try:
            ReportBuilder.generate_pdf_report(
                output_path=pdf_filepath,
                study_area_name=study_area_name
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF generation error: {e}")

    return FileResponse(
        path=pdf_filepath,
        media_type="application/pdf",
        filename=f"UrbanCoolSim_Executive_Report_{report_id[:8]}.pdf"
    )
