"""
generate_sample_pdf.py
Generates a realistic sample vendor service agreement PDF for testing.
Run this once: python tests/generate_sample_pdf.py
It will create tests/sample_contracts/vendor_agreement.pdf
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "sample_contracts")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def generate_vendor_agreement():
    path = os.path.join(OUTPUT_DIR, "vendor_agreement.pdf")
    doc = SimpleDocTemplate(
        path,
        pagesize=A4,
        rightMargin=2.5 * cm,
        leftMargin=2.5 * cm,
        topMargin=2.5 * cm,
        bottomMargin=2.5 * cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "Title", parent=styles["Heading1"],
        fontSize=16, alignment=TA_CENTER, spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        "Subtitle", parent=styles["Normal"],
        fontSize=10, alignment=TA_CENTER, spaceAfter=20, textColor=colors.grey
    )
    heading_style = ParagraphStyle(
        "SectionHeading", parent=styles["Heading2"],
        fontSize=12, spaceBefore=14, spaceAfter=6,
        textColor=colors.HexColor("#1a1a2e")
    )
    body_style = ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontSize=10, leading=16, alignment=TA_JUSTIFY, spaceAfter=8
    )
    clause_style = ParagraphStyle(
        "Clause", parent=styles["Normal"],
        fontSize=10, leading=16, leftIndent=20, spaceAfter=6
    )

    story = []

    # ── Title block ──────────────────────────────────────────────────────────
    story.append(Paragraph("VENDOR SERVICE AGREEMENT", title_style))
    story.append(Paragraph("Contract Reference: VSA-2024-001", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cccccc")))
    story.append(Spacer(1, 0.4 * cm))

    # ── Parties ──────────────────────────────────────────────────────────────
    story.append(Paragraph("PARTIES", heading_style))
    story.append(Paragraph(
        "This Vendor Service Agreement (\"Agreement\") is entered into as of <b>January 1, 2024</b> "
        "(the \"Effective Date\") by and between:", body_style
    ))
    story.append(Paragraph(
        "<b>TechCorp Solutions Pvt. Ltd.</b>, a company incorporated under the laws of India, "
        "having its registered office at 42 MG Road, Bangalore, Karnataka 560001 "
        "(hereinafter referred to as \"Client\");", clause_style
    ))
    story.append(Paragraph("AND", ParagraphStyle("And", parent=styles["Normal"],
        fontSize=10, alignment=TA_CENTER, spaceBefore=4, spaceAfter=4)))
    story.append(Paragraph(
        "<b>CloudVendor Technologies Ltd.</b>, a company incorporated under the laws of India, "
        "having its registered office at 18 Cyber City, Hyderabad, Telangana 500081 "
        "(hereinafter referred to as \"Vendor\").", clause_style
    ))

    # ── Term ─────────────────────────────────────────────────────────────────
    story.append(Paragraph("1. TERM", heading_style))
    story.append(Paragraph(
        "1.1 This Agreement shall commence on the Effective Date of <b>January 1, 2024</b> "
        "and shall remain in force until <b>December 31, 2024</b> (\"Initial Term\"), "
        "unless earlier terminated in accordance with the provisions hereof.", body_style
    ))
    story.append(Paragraph(
        "1.2 <b>Auto-Renewal:</b> This Agreement shall automatically renew for successive one-year "
        "terms unless either party provides written notice of non-renewal at least "
        "<b>30 days prior</b> to the expiration of the then-current term. "
        "The renewal date shall be <b>December 1, 2024</b>.", body_style
    ))

    # ── Payment ──────────────────────────────────────────────────────────────
    story.append(Paragraph("2. PAYMENT TERMS", heading_style))
    story.append(Paragraph(
        "2.1 In consideration of the services rendered, Client shall pay Vendor a monthly "
        "fee of <b>INR 4,50,000 (Indian Rupees Four Lakh Fifty Thousand only)</b>, "
        "payable within <b>15 days</b> of receipt of invoice.", body_style
    ))
    story.append(Paragraph(
        "2.2 <b>Late Payment Penalty:</b> Any amount not paid by the due date shall accrue "
        "interest at the rate of <b>2% per month</b> (24% per annum) on the outstanding "
        "balance from the due date until the date of actual payment.", body_style
    ))
    story.append(Paragraph(
        "2.3 All payments shall be made via NEFT/RTGS to the Vendor's designated bank "
        "account. GST shall be charged additionally as applicable.", body_style
    ))

    # ── SLA ──────────────────────────────────────────────────────────────────
    story.append(Paragraph("3. SERVICE LEVEL AGREEMENT (SLA)", heading_style))
    story.append(Paragraph(
        "3.1 <b>Uptime Guarantee:</b> Vendor guarantees a minimum system uptime of "
        "<b>99.9%</b> measured on a monthly basis, excluding scheduled maintenance windows.", body_style
    ))
    story.append(Paragraph(
        "3.2 <b>Response Time:</b> Vendor shall respond to critical (P1) incidents within "
        "<b>1 hour</b> and resolve within <b>4 hours</b> of acknowledgement.", body_style
    ))
    story.append(Paragraph(
        "3.3 <b>SLA Breach Consequence:</b> For every 1% of uptime below the guaranteed "
        "99.9%, Client shall receive a <b>service credit of 10% of the monthly fee</b>. "
        "Total credits in any month shall not exceed 30% of the monthly fee.", body_style
    ))

    # ── Penalties ────────────────────────────────────────────────────────────
    story.append(Paragraph("4. PENALTIES AND LIQUIDATED DAMAGES", heading_style))
    story.append(Paragraph(
        "4.1 <b>Delivery Delay Penalty:</b> In the event Vendor fails to deliver any "
        "agreed milestone on time, Client may deduct <b>0.5% of the contract value per day</b> "
        "of delay, up to a maximum of 10% of the total contract value.", body_style
    ))
    story.append(Paragraph(
        "4.2 <b>Data Breach Penalty:</b> In the event of a data breach attributable to "
        "Vendor negligence, Vendor shall pay liquidated damages of <b>INR 10,00,000</b> "
        "(Ten Lakh Rupees) per incident.", body_style
    ))

    # ── Termination ──────────────────────────────────────────────────────────
    story.append(Paragraph("5. TERMINATION", heading_style))
    story.append(Paragraph(
        "5.1 <b>Termination for Convenience:</b> Either party may terminate this Agreement "
        "without cause by providing <b>60 days written notice</b> to the other party.", body_style
    ))
    story.append(Paragraph(
        "5.2 <b>Termination for Cause:</b> Either party may terminate this Agreement "
        "immediately upon written notice if the other party: (a) commits a material breach "
        "and fails to cure such breach within 15 days of written notice; (b) becomes "
        "insolvent or files for bankruptcy; or (c) engages in fraudulent activity.", body_style
    ))
    story.append(Paragraph(
        "5.3 Upon termination, Vendor shall deliver all Client data within <b>7 days</b> "
        "and permanently delete all copies from Vendor systems.", body_style
    ))

    # ── Liability ────────────────────────────────────────────────────────────
    story.append(Paragraph("6. LIABILITY AND INDEMNIFICATION", heading_style))
    story.append(Paragraph(
        "6.1 <b>Liability Cap:</b> In no event shall either party's total liability "
        "under this Agreement exceed <b>INR 25,00,000</b> (Twenty-Five Lakh Rupees) "
        "or the total fees paid in the preceding 3 months, whichever is lower.", body_style
    ))
    story.append(Paragraph(
        "6.2 <b>Indemnification:</b> Vendor shall indemnify, defend, and hold harmless "
        "Client from any third-party claims arising out of Vendor's gross negligence, "
        "wilful misconduct, or infringement of intellectual property rights.", body_style
    ))

    # ── Confidentiality ──────────────────────────────────────────────────────
    story.append(Paragraph("7. CONFIDENTIALITY", heading_style))
    story.append(Paragraph(
        "7.1 Both parties agree to keep confidential all proprietary information, trade "
        "secrets, and business data disclosed during the term of this Agreement and for "
        "<b>3 years</b> thereafter. Neither party shall disclose such information to "
        "third parties without prior written consent.", body_style
    ))

    # ── Governing Law ────────────────────────────────────────────────────────
    story.append(Paragraph("8. GOVERNING LAW AND DISPUTE RESOLUTION", heading_style))
    story.append(Paragraph(
        "8.1 This Agreement shall be governed by and construed in accordance with the "
        "laws of <b>India</b>. Any disputes shall be subject to the exclusive jurisdiction "
        "of the courts of <b>Bangalore, Karnataka</b>.", body_style
    ))
    story.append(Paragraph(
        "8.2 The parties agree to first attempt resolution through good-faith negotiation "
        "for 30 days before initiating formal legal proceedings.", body_style
    ))

    # ── Signatures ───────────────────────────────────────────────────────────
    story.append(Spacer(1, 1 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cccccc")))
    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph("IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.", body_style))
    story.append(Spacer(1, 0.8 * cm))

    sig_style = ParagraphStyle("Sig", parent=styles["Normal"], fontSize=10, spaceAfter=4)
    story.append(Paragraph("<b>TechCorp Solutions Pvt. Ltd.</b>", sig_style))
    story.append(Paragraph("Signed: _______________________", sig_style))
    story.append(Paragraph("Name: Rahul Sharma", sig_style))
    story.append(Paragraph("Title: Chief Procurement Officer", sig_style))
    story.append(Paragraph("Date: January 1, 2024", sig_style))
    story.append(Spacer(1, 0.8 * cm))
    story.append(Paragraph("<b>CloudVendor Technologies Ltd.</b>", sig_style))
    story.append(Paragraph("Signed: _______________________", sig_style))
    story.append(Paragraph("Name: Priya Patel", sig_style))
    story.append(Paragraph("Title: Chief Executive Officer", sig_style))
    story.append(Paragraph("Date: January 1, 2024", sig_style))

    doc.build(story)
    print(f"[generate_sample_pdf] Created: {path}")
    return path


if __name__ == "__main__":
    generate_vendor_agreement()
    print("Done. Find your PDF in tests/sample_contracts/")