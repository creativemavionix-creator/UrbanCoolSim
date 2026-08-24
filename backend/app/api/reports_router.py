import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.auth.security import get_current_user_optional
from app.models.db_models import User, Report
from app.schemas.schemas import ReportCreate, ReportResponse
from app.reports.report_builder import ReportBuilder

router = APIRouter(prefix="/reports", tags=["Decision Support Reports"])

@router.post("/generate", response_model=ReportResponse)
def generate_report(
    req: ReportCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    report_id = str(uuid.uuid4())
    md_content = ReportBuilder.generate_markdown_report(study_area_name="Connaught Place, New Delhi")
    
    # Generate PDF file
    reports_dir = os.path.join(settings.STORAGE_DIR, "reports")
    os.makedirs(reports_dir, exist_ok=True)
    pdf_filepath = os.path.join(reports_dir, f"report_{report_id}.pdf")
    
    try:
        ReportBuilder.generate_pdf_report(
            output_path=pdf_filepath,
            study_area_name="Connaught Place, New Delhi"
        )
        pdf_path_val = f"/api/v1/reports/{report_id}/pdf"
    except Exception as e:
        print(f"[UrbanCoolSim] PDF generation notice: {e}")
        pdf_path_val = None

    report_db = Report(
        id=report_id,
        title=req.title or "UrbanCoolSim Technical Decision-Support Executive Report",
        summary="Comprehensive surface energy balance physics simulation, AI surrogate explainability, and multi-objective optimization results.",
        markdown_content=md_content,
        pdf_path=pdf_path_val,
        study_area_id=req.study_area_id,
        scenario_id=req.scenario_id,
        optimization_run_id=req.optimization_run_id
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
    reports_dir = os.path.join(settings.STORAGE_DIR, "reports")
    pdf_filepath = os.path.join(reports_dir, f"report_{report_id}.pdf")
    
    if not os.path.exists(pdf_filepath):
        # Generate on the fly if needed
        try:
            ReportBuilder.generate_pdf_report(
                output_path=pdf_filepath,
                study_area_name="Connaught Place, New Delhi"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF generation error: {e}")

    return FileResponse(
        path=pdf_filepath,
        media_type="application/pdf",
        filename=f"UrbanCoolSim_Executive_Report_{report_id[:8]}.pdf"
    )
