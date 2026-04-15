# pipeline/create_test_pdf.py
from fpdf import FPDF

pdf = FPDF()
pdf.add_page()
pdf.set_font("Helvetica", size=12)

content = """
EMPLOYEE HANDBOOK - ACME CORP

1. CUTI TAHUNAN
Setiap karyawan tetap mendapatkan 12 hari cuti tahunan per tahun.
Cuti mulai aktif setelah 3 bulan masa percobaan selesai.
Pengajuan cuti minimal 3 hari sebelumnya via sistem HR.

2. JAM KERJA
Jam kerja normal adalah 09.00 - 18.00 WIB, Senin sampai Jumat.
Toleransi keterlambatan maksimal 15 menit per hari.

3. STRUKTUR ORGANISASI
- CEO: Budi Santoso
- Head of Engineering: Rina Wijaya
- Head of HR: Dewi Kusuma
- Head of Marketing: Anton Halim

4. TOOLS YANG DIGUNAKAN
- Komunikasi: Slack
- Project Management: Notion
- Code Repository: GitHub
- Design: Figma

5. ONBOARDING CHECKLIST
Minggu pertama karyawan baru wajib:
- Setup laptop dan akun tools
- Perkenalan dengan semua tim
- Baca Employee Handbook
- Meeting 1-on-1 dengan manager
"""

for line in content.strip().split("\n"):
    pdf.cell(0, 8, line.strip(), ln=True)

pdf.output("test.pdf")
print("✅ test.pdf created!")